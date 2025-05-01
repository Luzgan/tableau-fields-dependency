/**
 * Core types for Tableau Workbook (.twb) file structure
 */

export interface ParameterColumn {
  name: string;
  datatype: string;
  role: string;
  caption?: string;
}

/**
 * Calculated field - always has a calculation element
 */
export interface CalculatedColumn {
  name: string;
  datatype: string;
  role: string;
  caption?: string;
  calculation: {
    formula: string;
  };
}

export interface DataSourceColumn {
  name: string;
  datatype: string;
  role: string;
  caption?: string;
}

export interface RelationColumn {
  datatype: string;
  name: string;
}

/**
 * Column mapping in a datasource
 */
export interface ColumnMapping {
  key: string;
  value: string;
}

/**
 * Relation definition in a datasource
 */
export interface Relation {
  type: "table" | "join" | "collection" | "pivot";
  name?: string;
  columns?: {
    column: RelationColumn | RelationColumn[];
  };
}

/**
 * Metadata record in a datasource
 */
export interface MetadataRecord {
  class: string;
  "local-name": string;
  "local-type": string;
}

/**
 * Datasource definition
 */
export interface Datasource {
  name: string;
  caption?: string;
  connection?: {
    relation?: Relation | Relation[];
    cols?: {
      map: ColumnMapping | ColumnMapping[];
    };
    "metadata-records"?: {
      "metadata-record": MetadataRecord | MetadataRecord[];
    };
  };
  column?:
    | (ParameterColumn | CalculatedColumn | DataSourceColumn)
    | (ParameterColumn | CalculatedColumn | DataSourceColumn)[];
}

/**
 * Root workbook structure
 */
export interface TWBFile {
  workbook: {
    datasources: {
      datasource: Datasource | Datasource[];
    };
  };
}

/**
 * Helper function to determine role based on datatype
 */
export function getDefaultRoleForDatatype(
  datatype: string
): "measure" | "dimension" {
  switch (datatype) {
    case "integer":
    case "real":
      return "measure";
    case "string":
    case "date":
    case "datetime":
    case "boolean":
      return "dimension";
    default:
      return "dimension";
  }
}
