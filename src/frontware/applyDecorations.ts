import { Position, Range, TextDocument, ThemeColor, window, workspace } from "vscode";
import readComponentMappingsForPath from "../middleware/find-components/readComponentMappingsForPath";
import readComponentConfiguration from "../middleware/read-component-configuratiron/readComponentConfiguration";
import getParentTag from "../middleware/find-components/helpers/getParentTag";


const decorationType = window.createTextEditorDecorationType({
    color: "#4FC9B0",
    fontWeight: 'regular'
});

const slotDecorationType = window.createTextEditorDecorationType({
    color: "#C586C0",
    fontWeight: 'regular'
});

let session = 0;

export default async function applyDecorations(document: TextDocument) {
    session += 1
    const currentSession = session;
    const components = await readComponentMappingsForPath(document.uri.fsPath)
    if (!components || currentSession != session) return;

    const editor = window.visibleTextEditors.find(e => e.document === document);
    if (!editor) return;

    const text = document.getText();
    const ranges: Range[] = [];
    const usedComponents = new Set<string>()

    Object.keys(components).forEach(componentName => {
        const regex = new RegExp(`\\b${componentName}\\b`, 'g');
        let match;

        while ((match = regex.exec(text)) !== null) {
            let start = document.positionAt(match.index);
            if (start.character > 0) {
                const rangeBeforeStart = new Range(
                    new Position(start.line, 0), // Start from the beginning of the line
                    start // Up to the start position
                );

                const textBeforeStart = document.getText(rangeBeforeStart);
                if (textBeforeStart.endsWith("</")) {
                    start = document.positionAt(match.index - 2)
                } else if (textBeforeStart.endsWith("<")) {
                    start = document.positionAt(match.index - 1)
                } else {
                    continue;
                }
            }
            const end = document.positionAt(match.index + componentName.length + 1);
            usedComponents.add(componentName)
            ranges.push(new Range(start, end));
        }
    });

    // Clear old decorations by setting an empty range array
    editor.setDecorations(decorationType, []);

    editor.setDecorations(decorationType, ranges);

    const slotDecoratorRanges = await Promise.all(Array.from(usedComponents).map(async x => {
        const path = components[x]
        return await getSlotDecoratorRanges(x, path, text, document)
    }))
    if (currentSession != session) return;

    editor.setDecorations(slotDecorationType, [])

    editor.setDecorations(slotDecorationType, slotDecoratorRanges.flat())
}

async function getSlotDecoratorRanges(componentName: string, path: string, text: string, document: TextDocument) {
    const configuration = await readComponentConfiguration(path)
    if (!configuration) return []
    let ranges: Range[] = []

    configuration.slots.forEach(slotName => {
        const regex = new RegExp(`\\b${slotName}\\b`, 'g');
        let match;

        while ((match = regex.exec(text)) !== null) {
            let start = document.positionAt(match.index);
            const originalStart = start
            let useEnd: boolean = false
            if (start.character > 0) {
                const rangeBeforeStart = new Range(
                    new Position(start.line, 0), // Start from the beginning of the line
                    start // Up to the start position
                );
                const textBeforeStart = document.getText(rangeBeforeStart);
                if (textBeforeStart.endsWith("</")) {
                    start = document.positionAt(match.index - 2)
                    useEnd = true
                } else if (textBeforeStart.endsWith("<")) {
                    start = document.positionAt(match.index - 1)
                } else {
                    continue;
                }
            }
            const end = document.positionAt(match.index + slotName.length + 1);
            if ((getParentTag(document, useEnd ? end : originalStart)) == componentName) {
                ranges.push(new Range(start, end));
            } 
        }
    });
    return ranges
}