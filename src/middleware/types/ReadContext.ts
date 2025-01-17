import { SourceFile } from "typescript"

type ReadContext = { mappings: Record<string, string>, sourceFile: SourceFile, sourceFileFolder: string }

export default ReadContext