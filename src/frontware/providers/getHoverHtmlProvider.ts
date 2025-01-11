import { Hover, languages, Range } from "vscode";
import extractTemplateContent from "../../middleware/find-components/extractTemplateContent";
import mapOffsetToHtml from "../../middleware/find-components/mapOffsetToHtml";
import { getLanguageService, TextDocument } from 'vscode-html-languageservice'

export default function getHoverHtmlProvider() {
    const htmlLanguageService = getLanguageService();
    return languages.registerHoverProvider('mesa', {
        provideHover(document, position) {
            const text = document.getText();
            const html = extractTemplateContent(text);
            const offset = document.offsetAt(position);
            const htmlOffsetIndex = mapOffsetToHtml(html, offset);
            if (!htmlOffsetIndex) return null;
            const htmlOffsetPosition = document.positionAt(htmlOffsetIndex)

            const htmlDocument = htmlLanguageService.parseHTMLDocument(TextDocument.create(
                document.uri.toString(),
                'html',
                document.version,
                html
            ));

            const hover = htmlLanguageService.doHover(
                TextDocument.create(
                    document.uri.toString(),
                    'html',
                    document.version,
                    html
                ),
                htmlOffsetPosition,
                htmlDocument
            ); 
            if (!hover) return null;
            if (!hover.range) return null;
            return new Hover(hover.contents as any, new Range(hover.range.start as any, hover.range.end as any));
        }
    });
}