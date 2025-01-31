import findViteConfig from "./findViteConfig";
import readComponentMappings from "./reader/readComponentMappings";

let current: { path: string, configPath: string, mappings: Promise<Record<string, string>>, clearTimeout: any } | undefined

export default async function readComponentMappingsForPath(path: string) {
    if (current?.path == path) return current.mappings
    const viteConfigPath = findViteConfig(path);
    if (!viteConfigPath) {
        return null;
    }
    if (current && current.configPath == viteConfigPath) {
        current.path = path
        return current.mappings
    }
    const componentMappings = readComponentMappings(viteConfigPath);
    clearTimeout(current?.clearTimeout)
    const timeout = setTimeout(() => {
        current = undefined
    }, 7000);
    current = {
        path: path,
        configPath: viteConfigPath,
        mappings: componentMappings,
        clearTimeout: timeout
    }
    await current.mappings
    return componentMappings
}