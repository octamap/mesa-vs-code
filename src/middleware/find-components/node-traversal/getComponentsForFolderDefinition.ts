import ts from "typescript";
import getAllChildrenOfFolder from "../helpers/getAllChildrenOfFolder";
import path from "path";
import { createNamesForPaths } from "../helpers/createNamesForPaths";
import toKebabCase from "../helpers/toKebabCase";

export default function getComponentsForFolderDefinition(definition: ts.Expression, definitionFilePath: string, prefix?: string): Record<string, string> {
    let relativeFolderPath: string;

    if (ts.isStringLiteral(definition)) {
        relativeFolderPath = definition.text; // Extracts the text without quotes
    } else {
        relativeFolderPath = definition.getText().slice(1, -1); // Fallback to slicing
    }
    const absoluteFolderPath = path.resolve(definitionFilePath, relativeFolderPath)
    // Get the path to all the children in absolute path, not just direct children but all
    const allChildren = getAllChildrenOfFolder(absoluteFolderPath)
    if (allChildren.length == 0) {
        console.warn("[ MESA ] - Did not find any files in " + absoluteFolderPath)
        return {}
    }

    // All children with relative path
    const relativeOfAllChildren = allChildren.map(childPath =>
        path.relative(absoluteFolderPath, childPath)
    );

    // Map to components
    prefix = prefix ? toKebabCase(prefix) : undefined
    const names = prefix ? relativeOfAllChildren.map(x => {
        let cleanPath = x.replace(/^\/+/, '');
        const parts = cleanPath.split('/')
        const file = parts.pop() || '';
        const ext = path.extname(file);
        const fileWithoutExt = toKebabCase(path.basename(file, ext));
        return `${prefix}-${fileWithoutExt}`
    }) : createNamesForPaths(relativeOfAllChildren)

    const components: Record<string, string> = {}
    for (let index = 0; index < names.length; index++) {
        const name = names[index];
        const relativePath = relativeOfAllChildren[index]
        components[name] = path.resolve(absoluteFolderPath, relativePath)
    }
    return components
}