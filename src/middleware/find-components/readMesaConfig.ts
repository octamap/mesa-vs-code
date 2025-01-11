import * as fs from 'fs';
import * as path from 'path';
import * as esbuild from 'esbuild';
import { NodeVM } from 'vm2';
import resolveComponents from './resolveComponents';

export default async function readMesaConfig(configPath: string): Promise<Record<string, string>> {
    // Transpile the TypeScript config to JavaScript using esbuild
    const sourceCode = fs.readFileSync(configPath, 'utf-8');

    const result = await esbuild.transform(sourceCode, {
        loader: 'ts',
        format: 'cjs',
        target: 'node14', // Adjust based on your Node.js version
        sourcemap: false,
        // You might need to add additional esbuild options based on your config
    });

    // Set up a sandboxed environment using vm2
    const vm = new NodeVM({
        console: 'inherit',
        sandbox: {},
        require: {
            external: true,
            context: 'sandbox',
            // Specify any modules that need to be allowed
            // For example, if your vite.config.ts imports 'path', 'fs', etc.
            // You might need to whitelist them or handle them appropriately
        },
    });

    let configExport: any;
    try {
        // Execute the transpiled code within the sandbox
        configExport = vm.run(result.code, configPath);
    } catch (error) {
        console.error('Error evaluating vite.config.ts:', error);
        throw new Error('Failed to evaluate vite.config.ts');
    }

    // Ensure the configuration is exported as default
    const config = configExport?.default || configExport;

    if (!config || !config.plugins) {
        throw new Error('Invalid Vite configuration file: No plugins found.');
    }

    // Find the Mesa plugin
    const mesaPlugin = config.plugins.find((plugin: any) => {
        // Depending on how the Mesa plugin identifies itself, adjust this condition
        // For example, if Mesa plugin has a specific name property
        return plugin.name === 'Mesa' || plugin.constructor?.name === 'Mesa';
    });

    if (!mesaPlugin || typeof mesaPlugin !== 'object') {
        throw new Error('Mesa plugin not found in Vite configuration.');
    }

    return resolveComponents(mesaPlugin, path.dirname(configPath));
}