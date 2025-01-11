// mapOffsetToHtml.ts
export default function mapOffsetToHtml(text: string, originalOffset: number): number | undefined {
    const templateMatch = text.match(/<template>([\s\S]*?)<\/template>/);
    if (!templateMatch) {
        return undefined;
    }

    const templateStart = templateMatch.index! + '<template>'.length;
    const relativeOffset = originalOffset - templateStart;

    // Ensure the offset is within the <template> content
    if (relativeOffset < 0 || relativeOffset > templateMatch[1].length) {
        return undefined;
    }

    return relativeOffset;
}