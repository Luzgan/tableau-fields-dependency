/**
 * Raw TWB column and calculation types as they appear in the XML
 */

import { ColumnAggregationType, ColumnDataType, ColumnRole } from "./enums";

/**
 * Base attributes common to all column types in TWB files
 */
export interface BaseTWBColumn {
  // Required fields that are truly common across all types
  "@_name": string;
  "@_datatype": ColumnDataType;
  "@_role": ColumnRole;

  // Optional field that is common across all types
  "@_caption"?: string;
}

/**
 * Regular column (data source field) in TWB files
 */
export interface TWBRegularColumn extends BaseTWBColumn {
  // Required for regular columns
  "@_aggregation": ColumnAggregationType;

  // Data source specific fields
  "@_ordinal": string;
  "@_remote-alias": string;
  "@_remote-name": string;
  "@_remote-type": string;
  "@_precision"?: string;
  "@_contains-null"?: string;
  "@_local-type"?: string;
}

/**
 * Member definition in TWB files
 */
interface TWBMember {
  "@_value": string;
  "@_alias"?: string;
}

/**
 * Alias definition in TWB files
 */
interface TWBAlias {
  "@_key": string;
  "@_value": string;
}

/**
 * Range definition in TWB files
 */
export interface TWBRange {
  "@_min": string | number;
  "@_max": string | number;
}

/**
 * Parameter column in TWB files
 */
export interface TWBParameterColumn extends BaseTWBColumn {
  "@_param-domain-type": "list" | "range";
  "@_default-format"?: string;
  members?: {
    member: TWBMember[];
  };
  range?: TWBRange;
  aliases?: {
    alias: TWBAlias[];
  };
  calculation?: {
    "@_class": "tableau";
    "@_formula": string;
  };
}

/**
 * Calculation definition in TWB files
 */
export interface TWBCalculation {
  "@_class": "tableau";
  "@_formula": string;
}

/**
 * Calculation column in TWB files
 */
export interface TWBCalculationColumn extends BaseTWBColumn {
  "@_default-format"?: string;
  calculation: TWBCalculation;
}

/**
 * Internal Tableau column in TWB files
 * These columns are used by Tableau internally and have special datatypes
 */
export interface TWBInternalColumn extends BaseTWBColumn {
  "@_name": `[__tableau_internal_object_id__].${string}`;
  "@_datatype": ColumnDataType.Table;
}

/**
 * Relation column in TWB files
 */
export interface TWBRelationColumn {
  "@_datatype": ColumnDataType;
  "@_name": string;
  "@_ordinal": string;
  "@_role"?: ColumnRole;
  "@_caption"?: string;
  "@_aggregation"?: ColumnAggregationType;
}

/**
 * Union type for any column in TWB files
 */
export type TWBColumn =
  | TWBRegularColumn
  | TWBCalculationColumn
  | TWBParameterColumn
  | TWBInternalColumn
  | TWBRelationColumn;

/**
 * Metadata record in TWB files
 */
export interface TWBMetadataRecord {
  "@_class": string;
  "remote-name": string;
  "remote-type": string;
  "local-name": string;
  "local-type": string;
  "parent-name": string;
  "remote-alias"?: string;
  ordinal?: number;
  aggregation?: string;
  "contains-null"?: boolean;
  precision?: number;
  width?: number;
  collation?: {
    /** Numeric flag indicating character set (e.g., "0" for binary) */
    "@_flag": string;
    /** Collation name (e.g., "binary" for binary collation) */
    "@_name": string;
  };
  attributes?: {
    attribute: Array<{
      "@_datatype": string;
      "@_name": string;
      "@_value": string;
    }>;
  };
  "object-id"?: string;
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
  relation: TWBRelation | TWBRelation[];
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

/**
 * Helper type guard to check if a column is an internal Tableau column
 */
export function isInternalColumn(
  column: TWBColumn
): column is TWBInternalColumn {
  return column["@_name"].includes("[__tableau_internal_object_id__]");
}

/**
 * Helper type guard to check if a column is a relation column
 */
export function isRelationColumn(
  column: TWBColumn
): column is TWBRelationColumn {
  return (
    !isCalculationColumn(column) &&
    !isParameterColumn(column) &&
    !isInternalColumn(column) &&
    !(column as TWBRegularColumn)["@_remote-name"]
  );
}

/**
 * Helper type guard to check if a column is a data source
 */
export function isDataSourceColumn(
  column: TWBColumn
): column is TWBRegularColumn {
  return (
    !isCalculationColumn(column) &&
    !isParameterColumn(column) &&
    !isInternalColumn(column) &&
    !isRelationColumn(column)
  );
}

/**
 * Document format change manifest in TWB files
 */
export interface TWBDocumentFormatChangeManifest {
  [key: string]: boolean | undefined;
}

/**
 * Repository location in TWB files
 */
export interface TWBRepositoryLocation {
  "@_derived-from"?: string;
  "@_id"?: string;
  "@_path"?: string;
  "@_revision"?: string;
  "@_site"?: string;
}

/**
 * Preference in TWB files
 */
export interface TWBPreference {
  "@_name": string;
  "@_value": string;
}

/**
 * Style format in TWB files
 */
export interface TWBStyleFormat {
  "@_attr": string;
  "@_value": string;
}

/**
 * Style rule in TWB files
 */
export interface TWBStyleRule {
  "@_element": string;
  format: TWBStyleFormat | TWBStyleFormat[];
}

/**
 * Style in TWB files
 */
export interface TWBStyle {
  "style-rule": TWBStyleRule | TWBStyleRule[];
}

/**
 * Workbook structure in TWB files
 */
export interface TWBWorkbook {
  "@_original-version": string;
  "@_version": string;
  "@_source-build": string;
  "@_source-platform": string;
  "@_xml:base"?: string;
  "@_include-phone-layouts"?: string;
  "@_xmlns:user"?: string;

  "document-format-change-manifest": TWBDocumentFormatChangeManifest;
  "repository-location"?: TWBRepositoryLocation;
  preferences: {
    preference: TWBPreference | TWBPreference[];
  };
  style?: TWBStyle;
  datasources: {
    datasource: TWBDatasource | TWBDatasource[];
  };
}

/**
 * Root TWB file structure
 */
export interface TWBFile {
  workbook: TWBWorkbook;
}
