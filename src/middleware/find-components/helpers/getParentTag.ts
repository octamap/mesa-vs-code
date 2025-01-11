import { Position, TextDocument } from "vscode";


export default function getParentTag(document: TextDocument, position: Position): string | null {
    // Updated regex to capture self-closing tags
    const tagRegex = /<\/?([\w-]+)[^>]*?(\/?)>/g;

    // Stack to track opening tags
    let tagStack: string[] = [];

    // Aggregate all lines up to the current position to handle multi-line tags
    let textUpToPosition = '';
    for (let i = 0; i <= position.line; i++) {
        textUpToPosition += document.lineAt(i).text + "\n";
    }

    // Using lastIndex to continue searching from the last match
    let match: RegExpExecArray | null;
    while ((match = tagRegex.exec(textUpToPosition)) !== null) {
        if (match.index + match[0].length > document.offsetAt(position)) {
            // Stop if the match extends beyond the cursor position
            break;
        }

        const isClosingTag = match[0].startsWith('</');
        const tagName = match[1];
        const isSelfClosing = match[2] === '/';

        if (!isClosingTag) {
            if (!isSelfClosing) {
                // Push to stack if it's an opening tag and not self-closing
                tagStack.push(tagName);
            }
            // If it's a self-closing tag, do not push to stack
        } else {
            // Pop from stack if it's a closing tag matching the last opened tag
            if (tagStack.length > 0 && tagStack[tagStack.length - 1] === tagName) {
                tagStack.pop();
            }
        }
    }

    // The current parent tag, if any, is the last one in the stack
    return tagStack.length > 0 ? tagStack[tagStack.length - 1] : null;
}