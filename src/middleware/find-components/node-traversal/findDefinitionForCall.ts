import ts, { SourceFile } from "typescript";
import ComponentDefinition from "../../types/ComponentDefinition.js";

export default function findDefinitionForCall(call: ts.CallExpression, sourceFile: SourceFile): ComponentDefinition | null {
    const functionName = call.expression.getText(sourceFile);

    if (functionName === "components") {
        if (call.arguments.length >= 2) {
            return { type: "components", paths: call.arguments[1] }
        }
    } else if (functionName == "folder") {
        if (call.arguments.length >= 1) {

            const path = call.arguments[0];
            let prefix: string | undefined = undefined; // Default prefix is undefined

            // Check for configuration object
            if (call.arguments.length >= 2) {
                const configArg = call.arguments[1];
                if (ts.isObjectLiteralExpression(configArg)) {
                    // Iterate over the properties of the object
                    configArg.properties.forEach(property => {
                        if (ts.isPropertyAssignment(property)) {
                            const key = property.name.getText(sourceFile);
                            if (key === "prefix" && ts.isStringLiteral(property.initializer)) {
                                // Extract the prefix value
                                prefix = property.initializer.text;
                            }
                        }
                    });
                }
            }

            return { type: "folder", path, prefix }
        }
    }
    return null;
}