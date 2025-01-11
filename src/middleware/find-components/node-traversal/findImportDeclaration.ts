import ts from "typescript";

export default function findImportDeclaration(sourceFile: ts.SourceFile, variableName: string) {
    let importPath: string | null = null;

    function visit(node: ts.Node) {
        if (ts.isImportDeclaration(node)) {
            const namedBindings = node.importClause?.namedBindings;
            if (!namedBindings) return null;
            if (ts.isNamedImports(namedBindings)) {
                for (const element of namedBindings.elements) {
                    if (element.name.getText() === variableName) {
                        importPath = (node.moduleSpecifier as ts.StringLiteral).text;
                        break;
                    }
                }
            }
        }
        ts.forEachChild(node, visit);
    }

    ts.forEachChild(sourceFile, visit);
    return importPath;
}