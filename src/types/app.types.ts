import { ColumnDataType, ColumnRole } from "./enums";

export type NodeType = "datasource" | "calculation" | "parameter";

export interface BaseNode {
  id: string;
  name: string;
  type: NodeType;
  caption?: string;
  dataType: ColumnDataType;
  role: ColumnRole;
  displayName: string;
  datasourceName: string;
  hidden?: boolean;
}

export interface DatasourceNode extends BaseNode {
  type: "datasource";
}

export interface ParameterNode extends BaseNode {
  type: "parameter";
}

export interface CalculationNode extends BaseNode {
  type: "calculation";
  calculation: string;
}

export type Node = DatasourceNode | CalculationNode | ParameterNode;

export interface UnresolvedReference {
  sourceId: string;
  type: "direct" | "indirect";
  matchedText: string;
  targetDatasourceName?: string;
  targetName: string;
}

export interface Reference extends UnresolvedReference {
  targetId: string;
}

export interface FileData extends TransformedTWBFileData {
  filename: string;
}

export interface TransformedTWBFileData {
  nodesById: Map<string, Node>;
  references: Reference[];
}

export interface AppContextType {
  fileData: FileData | null;
  setFileData: (data: FileData | null) => void;
  helpers: {
    getNodes: () => Node[];
    getNodeById: (id: string) => Node | undefined;
    getReferencesForNode: (nodeId: string) => Reference[];
    getReferencingNodes: (nodeId: string) => Node[];
    getReferencedNodes: (nodeId: string) => Node[];
  };
}

export interface FilterOptions {
  searchTerm: string;
  selectedTypes: NodeType[];
}
