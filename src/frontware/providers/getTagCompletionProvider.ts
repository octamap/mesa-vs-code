import * as path from "path";
import { CompletionItem, CompletionItemKind, languages, window } from "vscode";
import readComponentMappingsForPath from "../../middleware/find-components/readComponentMappingsForPath";
import readComponentConfiguration from "../../middleware/read-component-configuratiron/readComponentConfiguration";
import getParentTag from "../../middleware/find-components/helpers/getParentTag";

export default function getTagCompletionProvider() {
    return languages.registerCompletionItemProvider(
        'html',
        {
            async provideCompletionItems(document, position) {
                const fileDir = path.dirname(document.uri.fsPath);
                const components = await readComponentMappingsForPath(fileDir)
            
                if (!components) {
                    window.showWarningMessage('No vite.config.ts found in the current directory tree.');
                    return [];
                }
                const completionItems: CompletionItem[] = [];
                Object.keys(components).forEach(componentName => {
                    const completionItem = new CompletionItem(componentName, CompletionItemKind.Class);
                    completionItem.sortText = `1_${componentName}`;
                    completionItems.push(completionItem);
                });
                const parentTag = getParentTag(document, position)
                if (parentTag) {
                    const parentComponentPath = components[parentTag];
                    if (parentComponentPath) {
                        // Add completion items for the slots with higher priority (lower sortText)
                        const config = await readComponentConfiguration(parentComponentPath);
                        if (config) {
                            for (const slotName of config.slots) {
                                const slotCompletionItem = new CompletionItem(slotName, CompletionItemKind.Field);
                                // Assign sortText with lower value to place these items before components
                                slotCompletionItem.sortText = `0_${slotName}`;
                                completionItems.push(slotCompletionItem);
                            }
                        }
                    }
                }
                return completionItems
            }
        },
        '<' // Trigger characters
    );
}