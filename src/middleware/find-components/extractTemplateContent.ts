
export default function extractTemplateContent(text: string): string {
    const templateMatch = text.match(/<template>([\s\S]*?)<\/template>/);
    return templateMatch ? templateMatch[1] : '';
}