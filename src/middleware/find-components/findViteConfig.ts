import * as path from "path";
import fs from "fs"

export default function findViteConfig(currentDir: string): string | null {
    const configFileName = 'vite.config.ts';
    let directory = currentDir;

    while (true) {
        const configPath = path.join(directory, configFileName);
        if (fs.existsSync(configPath)) {
            return configPath;
        }

        const parentDirectory = path.dirname(directory);
        if (parentDirectory === directory) { // Reached the root directory
            return null;
        }
        directory = parentDirectory;
    }
}