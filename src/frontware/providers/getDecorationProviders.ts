import { Range, window, workspace } from "vscode";
import applyDecorations from "../applyDecorations";


export default function getDecorationProviders() {
    return [
        workspace.onDidChangeTextDocument(editor => {
            if (editor && editor.document.languageId === 'html') {
                applyDecorations(editor.document);
            }
        }),
        window.onDidChangeActiveTextEditor(editor => {
            if (editor && editor.document.languageId === 'html') {
                applyDecorations(editor.document);
            }
        }) 
    ]
}