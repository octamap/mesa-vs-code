import path from "path";
import ts, { Expression, ObjectLiteralElementLike } from "typescript";
import ReadContext from "../../../types/ReadContext";
import readIdentifier from "./readIdentifier";
import readCall from "./readCall";

export default async function readAny(expression: ts.Expression | ObjectLiteralElementLike, context: ReadContext) {
    if (ts.isPropertyAssignment(expression)) {
        let componentName = expression.name.getText(context.sourceFile);
        if (componentName.startsWith("\"") && componentName.endsWith("\"")) {
            componentName = componentName.slice(1, -1)
        }

        // Check if the initializer is a string literal
        if (ts.isStringLiteral(expression.initializer)) {
            const componentPath = expression.initializer.text;
            context.mappings[componentName] = path.resolve(context.sourceFileFolder, componentPath);
        }

        // Check if the initializer is an object literal
        if (ts.isObjectLiteralExpression(expression.initializer)) {
            let absolutePath = '';
            expression.initializer.properties.forEach(subProp => {
                if (ts.isPropertyAssignment(subProp) &&
                    ts.isStringLiteral(subProp.initializer) &&
                    subProp.name.getText(context.sourceFile) === 'path') {
                    absolutePath = subProp.initializer.text;
                }
            });

            if (absolutePath) {
                context.mappings[componentName] = absolutePath;
            }
        }
    } else if (ts.isSpreadAssignment(expression)) {
        const spreadExpr: Expression = expression.expression;
        if (ts.isIdentifier(spreadExpr)) {
            await readIdentifier(spreadExpr, context)
        } else if (ts.isCallExpression(spreadExpr)) {
            readCall(spreadExpr, context)
        } else {
            console.warn(`[Mesa Extension] Unsupported spread expression: ${spreadExpr.getText(context.sourceFile)}`);
        }
    } else if (ts.isCallExpression(expression)) {
        readCall(expression, context)
    } else if (ts.isIdentifier(expression)) {
        await readIdentifier(expression, context)
    }
}
