import ts, { isObjectLiteralExpression, SourceFile } from "typescript";
import readAny from "./readers/readAny";


// Such as {"some-component": "./some-component.html", ...ComponentFromImport}
export default async function readComponentsOfExpression(properties: ts.Expression[], sourceFile: SourceFile, sourceFileFolder: string) {
    const mappings: Record<string, string> = {}
    const context = { sourceFile, mappings, sourceFileFolder }
    await Promise.all(properties.map(async arg => {
        if (isObjectLiteralExpression(arg)) {
            await Promise.all(arg.properties.map(async prop => {
                await readAny(prop, context)
            }))
        } else {
            await readAny(arg, context)
        }
    }))
    return mappings
}

