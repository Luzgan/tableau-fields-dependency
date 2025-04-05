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
 * Calculation column in TWB files
 */
export interface TWBCalculationColumn extends BaseTWBColumn {
  // Optional for parameters
  "@_param-domain-type"?: "list" | "range";
  // Required for calculations
  calculation: TWBCalculation;
}

/**
 * Union type for any column in TWB files
 */
export type TWBColumn = TWBRegularColumn | TWBCalculationColumn;

/**
 * Datasource structure in TWB files
 */
export interface TWBDatasource {
  // Required
  "@_name": string;
  // Optional - some datasources might not have columns
  column?: TWBColumn | TWBColumn[];
}

/**
 * Helper type guard to check if a column is a calculation
 */
export function isCalculationColumn(
  column: TWBColumn
): column is TWBCalculationColumn {
  return !!(
    (column as TWBCalculationColumn).calculation ||
    (column as TWBCalculationColumn)["@_param-domain-type"]
  );
}
