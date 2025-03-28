import * as fs from 'fs/promises';
import * as path from 'path';
import { window, workspace } from "vscode";

let cachedPackages: Promise<Record<string, string>> | undefined

export default async function findAllPackagesInWorkspace(): Promise<Record<string, string>> {
    if (cachedPackages) return cachedPackages;
    const newResponse = (async () => {
        const workspaceFolders = workspace.workspaceFolders;

        if (!workspaceFolders) {
            window.showWarningMessage('No workspace folders found.');
            return {};
        }

        const packageMap: Record<string, string> = {};

        // Search for all `package.json` files in the workspace
        const packageJsonFiles = await workspace.findFiles('**/package.json', '**/node_modules/**', 1000);

        await Promise.all(packageJsonFiles.map(async fileUri => {
            const packageJsonPath = fileUri.fsPath;

            try {
                const content = await fs.readFile(packageJsonPath, 'utf-8');
                const parsed = JSON.parse(content);

                if (parsed.name) {
                    const packageName = parsed.name;
                    const packageDir = path.dirname(packageJsonPath);
                    packageMap[packageName] = packageDir;
                }
            } catch (error) {
                console.warn(`Failed to read or parse package.json at ${packageJsonPath}:`, error);
            }
        }))
   
        return packageMap;
    })()
    cachedPackages = newResponse
    await newResponse;
    setTimeout(() => {
        cachedPackages = undefined;
    }, 1000 * 8);
    return newResponse
}
