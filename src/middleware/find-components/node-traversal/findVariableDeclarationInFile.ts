import * as fs from 'fs';
import ts, { SyntaxKind } from 'typescript';
import ComponentDefinition from '../../types/ComponentDefinition';
import findDefinitionForCall from './findDefinitionForCall';


export default function findVariableDeclarationInFile(filePath: string, variableName: string): ComponentDefinition | null {
    // Check if the file exists
    if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        return null;
    }

    // Read file content
    const code = fs.readFileSync(filePath, "utf-8");

    // Create a source file using TypeScript's compiler API
    const sourceFile = ts.createSourceFile(
        filePath,
        code,
        ts.ScriptTarget.Latest,
        true // Set `setParentNodes` to true for easier traversal
    );

    let argument: ComponentDefinition | null = null;

    // Visitor function to traverse the AST
    function visit(node: ts.Node) {
        // Check for a variable declaration with the matching name
        if (
            ts.isVariableDeclaration(node) &&
            node.name.getText(sourceFile) === variableName
        ) {
            const initializer = node.initializer;

            // Ensure the initializer exists and is a CallExpression
            if (initializer && ts.isCallExpression(initializer)) {
                const foundNew = findDefinitionForCall(initializer, sourceFile)
                if (foundNew) {
                    argument = foundNew
                }
            } else if (initializer && ts.isArrowFunction(initializer)) {
                let body = initializer.body;
                if (body && ts.isCallExpression(body)) {
                    const definiton = findDefinitionForCall(body, sourceFile)
                    if (definiton) {
                        argument = definiton
                    }
                }
            }
        }
        // Continue traversing the child nodes
        ts.forEachChild(node, visit);
    }

    // Start traversal
    ts.forEachChild(sourceFile, visit);

    if (!argument) {
        console.warn(`Variable "${variableName}" not found in file: ${filePath}`);
    }

    return argument;
}
