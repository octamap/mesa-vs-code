import ts from "typescript";

type ComponentDefinition = { type: "folder", path: ts.Expression, prefix?: string } | { type: "components", paths: ts.Expression }

export default ComponentDefinition