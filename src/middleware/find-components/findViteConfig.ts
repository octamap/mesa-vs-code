import * as path from "path";
import fs from "fs";

export default function findViteConfig(currentDir: string): string | null {
    const configFileNames = ['vite.config.ts', 'vite.config.js']; // Support both .ts and .js
    let directory = currentDir;

    let remainingAttempts = 30
    while (remainingAttempts != 0) {
        remainingAttempts -= 1
        for (const configFileName of configFileNames) {
            const configPath = path.join(directory, configFileName);
            if (fs.existsSync(configPath)) {
                return configPath;
            }
        }

        const parentDirectory = path.dirname(directory);
        if (parentDirectory === directory) { // Reached the root directory
            return null;
        }
        directory = parentDirectory;
    }
    return null;
}