import { ColumnAggregationType, ColumnDataType, ColumnRole } from "./enums";

export type NodeType = "column" | "calculation" | "parameter" | "internal";

interface BaseNode {
  id: string;
  name: string;
  type: NodeType;
  caption?: string;
  description?: string;
  dataType: ColumnDataType;
  role: ColumnRole;
  displayName: string;
}

/**
 * Column node in the graph
 */
export interface ColumnNode extends BaseNode {
  type: "column";
  dataType: ColumnDataType;
  role: ColumnRole;
  aggregation: ColumnAggregationType;
  precision?: number;
  containsNull: boolean;
  ordinal?: number;
  remoteAlias: string;
  remoteName: string;
  remoteType: string;
  metadata?: {
    remoteName: string;
    remoteType: string;
    localName: string;
    localType: string;
    parentName: string;
    remoteAlias?: string;
    ordinal?: number;
    aggregation?: string;
    containsNull?: boolean;
    precision?: number;
    width?: number;
    collation?: {
      flag: string;
      name: string;
    };
    attributes?: Array<{
      datatype: string;
      name: string;
      value: string;
    }>;
  };
}

export interface ParameterNode extends BaseNode {
  type: "parameter";
  paramDomainType: "list" | "range";
  defaultFormat?: string;
  members?: Array<{
    value: string;
    alias?: string;
  }>;
  range?: {
    min: string | number;
    max: string | number;
  };
  aliases?: Record<string, string>;
  calculation?: {
    class: "tableau";
    formula: string;
  };
}

export interface CalculationNode extends BaseNode {
  type: "calculation";
  defaultFormat?: string;
  calculation: string;
}

export interface InternalNode extends BaseNode {
  type: "internal";
  name: `[__tableau_internal_object_id__].${string}`;
  dataType: ColumnDataType.Table;
}

export type Node = ColumnNode | CalculationNode | ParameterNode | InternalNode;

export type Reference = {
  sourceId: string;
  targetId: string;
  type: "direct" | "indirect";
  matchedText: string;
};

export interface FileData {
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
