import { CallExpression } from "typescript";
import findDefinitionForCall from "../../node-traversal/findDefinitionForCall";
import ReadContext from "../../../types/ReadContext";
import getComponentsForFolderDefinition from "../../node-traversal/getComponentsForFolderDefinition";

export default function readCall(expression: CallExpression, context: ReadContext) {
    const definition = findDefinitionForCall(expression, context.sourceFile)
    if (definition) {
        const components = definition?.type == "folder" ? getComponentsForFolderDefinition(definition.path, context.sourceFileFolder, definition.prefix) : undefined
        if (components) {
            for (const [key, path] of Object.entries(components)) {
                context.mappings[key] = path
            }
        }
    } else {
        console.warn(`[Mesa Extension] Unsupported spread expression: ${expression.getText(context.sourceFile)}`);
    }
}