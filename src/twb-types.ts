/**
 * Raw TWB column and calculation types as they appear in the XML
 */

/**
 * Base attributes common to all column types in TWB files
 */
export interface BaseTWBColumn {
  // Required fields
  "@_name": string;
  "@_datatype": string;
  "@_role": string;

  // Optional fields
  "@_caption"?: string;
  "@_default-format"?: string;
  "@_precision"?: string;
  "@_contains-null"?: string;
  "@_ordinal"?: string;
  "@_remote-alias"?: string;
  "@_remote-name"?: string;
  "@_remote-type"?: string;
}

/**
 * Regular column in TWB files
 */
export interface TWBRegularColumn extends BaseTWBColumn {
  // Required for regular columns
  "@_aggregation": string;
}

/**
 * Calculation definition in TWB files
 */
export interface TWBCalculation {
  // Both fields are required in calculation
  "@_class": "tableau";
  "@_formula": string;
}

/**
 * Member definition in TWB files
 */
interface TWBMember {
  value: string;
  alias?: string;
}

/**
 * Members container in TWB files
 */
interface TWBMembers {
  member: TWBMember[];
}

/**
 * Parameter column in TWB files
 */
export interface TWBParameterColumn extends BaseTWBColumn {
  "@_param-domain-type": "list" | "range";
  members?: TWBMembers;
  aliases?: {
    alias: Array<{
      key: string;
      value: string;
    }>;
  };
}

/**
 * Calculation column in TWB files
 */
export interface TWBCalculationColumn extends BaseTWBColumn {
  calculation: TWBCalculation;
}

/**
 * Union type for any column in TWB files
 */
export type TWBColumn =
  | TWBRegularColumn
  | TWBCalculationColumn
  | TWBParameterColumn;

/**
 * Metadata record in TWB files
 */
export interface TWBMetadataRecord {
  "@_class": string;
  "remote-name": string;
  "remote-type": string;
  "local-name": string;
  "local-type": string;
  aggregation?: string;
  "contains-null"?: boolean;
  precision?: number;
  ordinal?: number;
}

/**
 * Relation column in TWB files
 */
export interface TWBRelationColumn {
  "@_datatype": string;
  "@_name": string;
  "@_ordinal": string;
}

/**
 * Relation structure in TWB files
 */
export interface TWBRelation {
  "@_join"?: string;
  "@_type"?: string;
  "@_connection"?: string;
  "@_name"?: string;
  "@_table"?: string;
  clause?: {
    "@_type": string;
    expression: {
      "@_op": string;
      expression: Array<{
        "@_op": string;
      }>;
    };
  };
  columns?: {
    "@_gridOrigin"?: string;
    "@_header"?: string;
    "@_outcome"?: string;
    column: TWBRelationColumn | TWBRelationColumn[];
  };
  relation?: TWBRelation | TWBRelation[];
}

/**
 * Connection structure in TWB files
 */
export interface TWBConnection {
  "@_class": string;
  "named-connections": {
    "named-connection": Array<{
      "@_caption": string;
      "@_name": string;
      connection: {
        "@_class": string;
        "@_cleaning"?: string;
        "@_compat"?: string;
        "@_directory"?: string;
        "@_tablename"?: string;
        "@_workgroup-auth-mode"?: string;
      };
    }>;
  };
  relation: TWBRelation;
}

/**
 * Datasource structure in TWB files
 */
export interface TWBDatasource {
  "@_name": string;
  "@_caption"?: string;
  "@_inline"?: string;
  "@_version"?: string;
  connection?: TWBConnection;
  "metadata-records"?: {
    "metadata-record": TWBMetadataRecord | TWBMetadataRecord[];
  };
  column?: TWBColumn | TWBColumn[];
}

/**
 * Helper type guard to check if a column is a calculation
 */
export function isCalculationColumn(
  column: TWBColumn
): column is TWBCalculationColumn {
  return !!(column as TWBCalculationColumn).calculation;
}

/**
 * Helper type guard to check if a column is a parameter
 */
export function isParameterColumn(
  column: TWBColumn
): column is TWBParameterColumn {
  return !!(column as TWBParameterColumn)["@_param-domain-type"];
}
