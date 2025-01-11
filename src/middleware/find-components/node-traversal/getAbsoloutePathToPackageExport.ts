import * as fs from 'fs';
import path from 'path';

export default function getAbsoloutePathToPackageExport(packageJsonPath: string, exportName: string) {
    try {
        // 1 - Get the package.json file data
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"))
        if ("exports" in packageJson) {
            let e = exportName.length == 0 ? "." : `./${exportName}`
            if (exportName == ".") {
                e = "."
            }
            if (e in packageJson.exports) {
                const variants = packageJson.exports[e]
                for (const type of ["default", "import", "require"]) {
                    if (type in variants) {
                        const dir = path.dirname(packageJsonPath)
                        const absolutePath = path.resolve(dir, variants[type])
                        return absolutePath
                    }
                }
            }
        }
    } catch (error) {
        console.error("Issue reading the exports of json at: ", packageJsonPath)
    }
}