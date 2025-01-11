import * as path from "path";

export default function resolveComponents(mesaPlugin: any, configDir: string): Record<string, string> {
    const resolvedComponents: Record<string, string> = {};

    // Assuming the Mesa plugin receives an object with component mappings as arguments
    // Adjust based on the actual structure of the Mesa plugin
    const mesaConfig = mesaPlugin.options || mesaPlugin; // Adjust property access as needed

    for (const [key, value] of Object.entries(mesaConfig)) {
        if (typeof value === 'string') {
            // Handle relative and absolute paths
            const absolutePath = path.isAbsolute(value)
                ? value
                : path.resolve(configDir, value);
            resolvedComponents[key] = absolutePath;
        } else if (value && typeof value === 'object' && "type" in value && value.type === 'absolute' && "path" in value && value.path === 'string') {
            // Handle absolute path objects
            resolvedComponents[key] = (value as any).path;
        } else {
            console.warn(`[MESA] Unsupported component definition for "${key}":`, value);
        }
    }

    return resolvedComponents;
}