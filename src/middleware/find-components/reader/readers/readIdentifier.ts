import findImportDeclaration from "../../node-traversal/findImportDeclaration";
import ReadContext from "../../../types/ReadContext";
import findAllPackagesInWorkspace from "../../findAllPackagesInWorkspace";
import path from "path";
import * as fs from "fs"
import getAbsoloutePathToPackageExport from "../../node-traversal/getAbsoloutePathToPackageExport";
import findVariableDeclarationInFile from "../../node-traversal/findVariableDeclarationInFile";
import getComponentsForFolderDefinition from "../../node-traversal/getComponentsForFolderDefinition";

export default async function readIdentifier(varName: string, context: ReadContext) {
    const importPath = findImportDeclaration(context.sourceFile, varName) as string | null;

    if (importPath) {

        // 2 - Resolve the file path 
        const paths: { absolutePath: string, projectDirectory: string } | null = await(async () => {
            try {
                try {
                    const p = require.resolve(importPath, { paths: [context.sourceFileFolder] });
                    return { absolutePath: p, projectDirectory: context.sourceFileFolder }
                } catch (error) {
                    const absolutePath = path.resolve(context.sourceFileFolder, importPath)
                    if (!fs.existsSync(absolutePath)) {
                        throw error;
                    }
                    return { absolutePath: absolutePath, projectDirectory: context.sourceFileFolder }
                }
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
                context.mappings[key] = path
            }
        }
    } else {
        console.log(`Import for ${varName} not found.`);
    }
}

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