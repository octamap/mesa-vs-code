import ts, { isCallExpression, isObjectLiteralExpression } from "typescript";

export default function findMesaCall(node: ts.Node, sourceFile: ts.SourceFile, remainingAttempts: number = 30): ts.Expression[] | null | undefined {
    const result = findIn(node, sourceFile)
    if (result) {
        return result
    }
    return ts.forEachChild(node, x => {
        const attempts = remainingAttempts - 1
        return findMesaCall(x, sourceFile, attempts)
    });
}

function findIn(node: ts.Node, sourceFile: ts.SourceFile): ts.Expression[] | null | undefined {
    if (ts.isCallExpression(node)) {
        const expressionText = node.expression.getText(sourceFile);
        if (expressionText !== "Mesa") return undefined;
        
        if (node.arguments.length > 0 && ts.isArrowFunction(node.arguments[0])) {
            const arrowFunc = node.arguments[0] as ts.ArrowFunction;
            let body = arrowFunc.body;


            if (ts.isCallExpression(body) || ts.isIdentifier(body)) {
                return [body]
            }
            
          
            // Unwrap ParenthesizedExpression
            if (ts.isParenthesizedExpression(body)) {
                body = body.expression; // Unwrap the expression inside the parentheses
            }

            // Check if body is a block (which might contain a return statement)
            if (ts.isBlock(body)) {
                const returnStatement = body.statements.find(st => ts.isReturnStatement(st)) as ts.ReturnStatement | undefined;
                if (returnStatement && returnStatement.expression) {
                    body = returnStatement.expression;
                }
            }

            // Now check if the body is an object literal expression
            if (isObjectLiteralExpression(body) || isCallExpression(body)) {
                return [body];
            } 
        }

        return node.arguments.filter(x => isObjectLiteralExpression(x) || isCallExpression(x)).map(arg => arg)
    }
}
