

import * as path from "path";
import { languages, Location, Position, TextDocument, Uri } from "vscode";
import readComponentMappingsForPath from "../../middleware/find-components/readComponentMappingsForPath";

export function getDefinitionProvider() {
    return languages.registerDefinitionProvider("html", {
        async provideDefinition(document: TextDocument, position: Position) {
            // Get the word at the current position.
            const wordRange = document.getWordRangeAtPosition(position);
            if (!wordRange) {
                return null;
            }
            const componentName = document.getText(wordRange);

            // Determine the directory of the current file and retrieve the component mappings.
            const fileDir = path.dirname(document.uri.fsPath);
            const components = await readComponentMappingsForPath(fileDir);
            if (!components) {
                return null;
            }

            // Check if the component exists in your mapping.
            const componentPath = components[componentName];
            if (!componentPath) {
                return null;
            }

            // Create a URI for the target component file.
            const targetUri = Uri.file(componentPath);

            // Define a target position. Here, it defaults to the very start of the file.
            // You can implement additional logic to locate the exact definition within the file.
            const targetPosition = new Position(0, 0);

            // Return a Location object that VS Code can jump to.
            return new Location(targetUri, targetPosition);
        }
    });
}