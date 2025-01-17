// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import getHoverHtmlProvider from './frontware/providers/getHoverHtmlProvider';
import getTagCompletionProvider from './frontware/providers/getTagCompletionProvider';
import getDecorationProviders from './frontware/providers/getDecorationProviders';
import applyDecorations from './frontware/applyDecorations';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log("Mesa is now active!");
	context.subscriptions.push(getHoverHtmlProvider());
	context.subscriptions.push(getTagCompletionProvider());

	const legend = new vscode.SemanticTokensLegend(['mesaComponent']);
	const selector = { language: 'html', scheme: 'file' };
	context.subscriptions.push(...getDecorationProviders())

	const applyDecorationsIfHtml = (editor: vscode.TextEditor | undefined) => {
		if (editor?.document.languageId === 'html') {
			applyDecorations(editor.document);
		}
	};

	applyDecorationsIfHtml(vscode.window.activeTextEditor);

	// Listen for when the active editor changes
	vscode.window.onDidChangeActiveTextEditor((editor) => {
		applyDecorationsIfHtml(editor);
	}, null, context.subscriptions);

	// Listen for document changes (e.g., file opened)
	vscode.workspace.onDidOpenTextDocument((document) => {
		if (document.languageId === 'html') {
			const editor = vscode.window.visibleTextEditors.find((ed) => ed.document === document);
			if (editor) {
				applyDecorations(editor.document);
			}
		}
	}, null, context.subscriptions);
}

// This method is called when your extension is deactivated
export function deactivate() {}
