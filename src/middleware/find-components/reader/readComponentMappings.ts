import fs from "fs"
import path from "path";
import ts from "typescript";
import findMesaCall from "./findMesaCall";
import readComponentsOfExpression from "./readComponentsOfExpression";

export default async function readComponentMappings(configPath: string) {
    const sourceCode = fs.readFileSync(configPath, 'utf-8');
    const sourceFile = ts.createSourceFile(configPath, sourceCode, ts.ScriptTarget.Latest, true);
    const mesaNode = findMesaCall(sourceFile, sourceFile);
    if (!mesaNode) {
        return {}
    }
    const folder = path.resolve(configPath, "..")
    return readComponentsOfExpression(mesaNode, sourceFile, folder);
}