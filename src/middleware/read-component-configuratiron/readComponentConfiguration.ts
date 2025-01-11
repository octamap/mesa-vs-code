import ComponentConfiguration from "../types/ComponentConfiguration";
import * as fs from "fs/promises"

let cache = new Map<string, Promise<ComponentConfiguration | undefined>>()

export default async function readComponentConfiguration(path: string) {
    const existing = cache.get(path)
    if (existing) return existing;
    const newGet = get(path)
    cache.set(path, newGet)
    setTimeout(() => {
        cache.delete(path)
    }, 2000);
    return newGet
}

async function get(path: string): Promise<ComponentConfiguration | undefined> {
    try {
        const config: ComponentConfiguration = { slots: [] };
        const content = (await fs.readFile(path)).toString();

        // Identify all slots 
        const regex = /#(\w+)/g;
        let match;
        while ((match = regex.exec(content)) !== null) {
            config.slots.push(match[1]);
        }
        return config;
    } catch (error) {
        console.error("Issue reading configuration of file", path)
    }
}