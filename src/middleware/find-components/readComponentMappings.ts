import fs from "fs"
import path from "path";
import ts, { Expression, SourceFile } from "typescript";
import findAllPackagesInWorkspace from "./findAllPackagesInWorkspace";
import findVariableDeclarationInFile from "./node-traversal/findVariableDeclarationInFile";
import getAbsoloutePathToPackageExport from "./node-traversal/getAbsoloutePathToPackageExport";
import findImportDeclaration from "./node-traversal/findImportDeclaration";
import getComponentsForFolderDefinition from "./node-traversal/getComponentsForFolderDefinition";
import findDefinitionForCall from "./node-traversal/findDefinitionForCall";

function getRemainingOfPath(basePath: string, longPath: string): string {
    if (!longPath.startsWith(basePath)) {
        throw new Error("The longPath does not start with the basePath");
    }
    if (basePath === longPath) {
        return "";
    }

    // Remove the basePath and trim any leading or trailing slashes
    const remaining = longPath.slice(basePath.length).replace(/^\/+/, '');
    return remaining;
}


// Such as {"some-component": "./some-component.html", ...ComponentFromImport}
async function readComponentsOfExpression(node: ts.CallExpression, sourceFile: SourceFile, sourceFileFolder: string) {
    const mappings: Record<string, string> = {}
    await Promise.all(node.arguments.map(async arg => {
        if (ts.isObjectLiteralExpression(arg)) {
            await Promise.all(arg.properties.map(async prop => {
                if (ts.isPropertyAssignment(prop)) {
                    let componentName = prop.name.getText(sourceFile);
                    if (componentName.startsWith("\"") && componentName.endsWith("\"")) {
                        componentName = componentName.slice(1, -1)
                    }

                    // Check if the initializer is a string literal
                    if (ts.isStringLiteral(prop.initializer)) {
                        const componentPath = prop.initializer.text;
                        mappings[componentName] = path.resolve(sourceFileFolder, componentPath);
                    }

                    // Check if the initializer is an object literal
                    if (ts.isObjectLiteralExpression(prop.initializer)) {
                        let absolutePath = '';
                        prop.initializer.properties.forEach(subProp => {
                            if (ts.isPropertyAssignment(subProp) &&
                                ts.isStringLiteral(subProp.initializer) &&
                                subProp.name.getText(sourceFile) === 'path') {
                                absolutePath = subProp.initializer.text;
                            }
                        });

                        if (absolutePath) {
                            mappings[componentName] = absolutePath;
                        }
                    }
                } else if (ts.isSpreadAssignment(prop)) {
                    const spreadExpr: Expression = prop.expression;
                    if (ts.isIdentifier(spreadExpr)) {
                        const varName = spreadExpr.text;

                        const importPath = findImportDeclaration(sourceFile, spreadExpr.text) as string | null;

                        if (importPath) {

                            // 2 - Resolve the file path 
                            const paths: {absolutePath: string, projectDirectory: string } | null = await (async () => {
                                try {
                                    const p = require.resolve(importPath, { paths: [sourceFileFolder] });
                                    return {absolutePath: p, projectDirectory: sourceFileFolder }
                                } catch (error) {
                                    const packages = await findAllPackagesInWorkspace()
                                    const packageNames = Object.keys(packages).filter(x => importPath.startsWith(x))
                                    if (packageNames.length) {
                                        const packageName = packageNames.reduce((longest, current) => {
                                            return current.length > longest.length ? current : longest;
                                        }, "");
                                        const exportName = getRemainingOfPath(packageName, importPath)
                                        const packageJsonPath = path.resolve(packages[packageName], "package.json")
                                        const absolutePath = getAbsoloutePathToPackageExport(packageJsonPath, exportName)
                                        if (absolutePath) {
                                            return { absolutePath, projectDirectory: packages[packageName] }
                                        }
                                    }
                                    console.error("Failed to resolve", varName, error)
                                }
                                return null;
                            })()
                            if (!paths) {
                                return;
                            }
                            const decleration = findVariableDeclarationInFile(paths.absolutePath, varName)
                            const components = decleration?.type == "folder" ? getComponentsForFolderDefinition(decleration.path, paths.projectDirectory, decleration.prefix) : undefined
                            if (components) {
                                for (const [key, path] of Object.entries(components)) {
                                    mappings[key] = path
                                }
                            }
                        } else {
                            console.log(`Import for ${varName} not found.`);
                        }

                    } else if (ts.isCallExpression(spreadExpr)) {
                        const definition = findDefinitionForCall(spreadExpr, sourceFile)
                        if (definition) {
                            const components = definition?.type == "folder" ? getComponentsForFolderDefinition(definition.path, sourceFileFolder, definition.prefix) : undefined
                            if (components) {
                                for (const [key, path] of Object.entries(components)) {
                                    mappings[key] = path
                                }
                            }
                        } else {
                            console.warn(`[Mesa Extension] Unsupported spread expression: ${spreadExpr.getText(sourceFile)}`);
                        }
                    } else {
                        console.warn(`[Mesa Extension] Unsupported spread expression: ${spreadExpr.getText(sourceFile)}`);
                    }
                }
            }))
        }
    }))
    return mappings
}


export default async function readComponentMappings(configPath: string) {
    const sourceCode = fs.readFileSync(configPath, 'utf-8');
    const sourceFile = ts.createSourceFile(configPath, sourceCode, ts.ScriptTarget.Latest, true);

    function findMesaCall(node: ts.Node): ts.CallExpression | null | undefined {
        if (ts.isCallExpression(node)) {
            const expressionText = node.expression.getText(sourceFile);
            if (expressionText === 'Mesa') {
                // Found the `Mesa` call expression
               return node
            }
        }

        const innerFound: ts.CallExpression | null | undefined = ts.forEachChild(node, findMesaCall);
        if (innerFound) {
            return innerFound
        }
        return null;
    }

    const mesaNode = ts.forEachChild(sourceFile, findMesaCall);
    if (!mesaNode) {
        return {}
    }
    const folder = path.resolve(configPath, "..")
    return readComponentsOfExpression(mesaNode, sourceFile, folder);
}