import path from "path";
import ts, { Expression, ObjectLiteralElementLike, SyntaxKind } from "typescript";
import ReadContext from "../../../types/ReadContext";
import readIdentifier from "./readIdentifier";
import readCall from "./readCall";

export default async function readAny(expression: ts.Expression | ObjectLiteralElementLike, ctx: ReadContext) {
    if (ts.isPropertyAssignment(expression)) {
        let componentName = expression.name.getText(ctx.sourceFile);
        if (componentName.startsWith("\"") && componentName.endsWith("\"")) {
            componentName = componentName.slice(1, -1)
        }

        // Check if the initializer is a string literal
        if (ts.isStringLiteral(expression.initializer)) {
            const componentPath = expression.initializer.text;
            ctx.mappings[componentName] = path.resolve(ctx.sourceFileFolder, componentPath);
        }

        // Check if the initializer is an object literal
        if (ts.isObjectLiteralExpression(expression.initializer)) {
            let absolutePath = '';
            expression.initializer.properties.forEach(subProp => {
                if (ts.isPropertyAssignment(subProp) &&
                    ts.isStringLiteral(subProp.initializer) &&
                    subProp.name.getText(ctx.sourceFile) === 'path') {
                    absolutePath = subProp.initializer.text;
                }
            });

            if (absolutePath) {
                ctx.mappings[componentName] = absolutePath;
            }
        }
    } else if (ts.isSpreadAssignment(expression)) {
        const spreadExpr: Expression = expression.expression;

        if (ts.isIdentifier(spreadExpr)) {
            await readIdentifier(spreadExpr.text, ctx)
        } else if (ts.isCallExpression(spreadExpr)) {
            const functionName = spreadExpr.getText(ctx.sourceFile);
            if (!(functionName.startsWith("folder(") || functionName.startsWith("components("))) {
                // Its a call to an external method (such as OctamapComponents())
                const indexOfParenthisis = functionName.indexOf("(")
                if (indexOfParenthisis != -1) {
                    await readIdentifier(functionName.slice(0, indexOfParenthisis), ctx)
                }
            } else {
                readCall(spreadExpr, ctx)
            }
        } else {
            console.warn(`[Mesa Extension] Unsupported spread expression: ${spreadExpr.getText(ctx.sourceFile)}`);
        }
    } else if (ts.isCallExpression(expression)) {
        readCall(expression, ctx)
    } else if (ts.isIdentifier(expression)) {
        await readIdentifier(expression.text, ctx)
    }
}
