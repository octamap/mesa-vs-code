import fs from 'fs';
import path from 'path';

/**
 * Recursively gets the paths of all files and directories inside a given folder.
 * @param dir The directory to read.
 * @returns An array of absolute paths of all children (files and folders).
 */
export default function getAllChildrenOfFolder(dir: string, max: number = 10000): string[] {
    let results: string[] = [];
    max -= 1;
    if (max <= 0) return results
    if (!fs.existsSync(dir)) {
        return [];
    }

    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        if (entry.isSymbolicLink()) {
            continue; // ⛔️ Skip symlinks entirely
        }

        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            // Recursively get children of subdirectory
            results = results.concat(getAllChildrenOfFolder(fullPath, max));
        } else {
            // Add file
            results.push(fullPath);
        }
    }

    return results;
}