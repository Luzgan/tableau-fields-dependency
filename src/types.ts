export type NodeType = "column" | "calculation";

export type DataType = "string" | "integer" | "real" | "date" | "boolean";
export type AggregationType = "Sum" | "Count" | "Year" | "None";
export type Role = "measure" | "dimension";

interface BaseNode {
  id: string;
  name: string;
  type: NodeType;
  caption?: string;
  description?: string;
  dataType?: DataType;
  role?: Role;
}

export interface ColumnNode extends BaseNode {
  type: "column";
  aggregation?: AggregationType;
  defaultFormat?: string;
  precision?: number;
  containsNull?: boolean;
  ordinal?: number;
  remoteAlias?: string;
  remoteName?: string;
  remoteType?: string;
}

export interface CalculationNode extends BaseNode {
  type: "calculation";
  formula?: string;
  calculation?: string;
  paramDomainType?: "list" | "range";
  class?: "tableau";
  members?: string[];
  aliases?: Record<string, string>;
}

export type Node = ColumnNode | CalculationNode;

export interface Reference {
  sourceId: string;
  targetId: string;
  type: "direct" | "indirect";
}

export interface FileData {
  filename: string;
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
