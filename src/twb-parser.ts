import {
  TWBDatasource,
  TWBRegularColumn,
  TWBCalculationColumn,
  TWBParameterColumn,
} from "./twb-types";
import { XMLParser } from "fast-xml-parser";

// Configure parser with the same options as in FileUpload.tsx
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  allowBooleanAttributes: true,
  preserveOrder: false,
});

/**
 * Supported input types for TWB parsing
 * - string: Raw XML content
 * - File: Browser File object (from file input)
 * - Blob: Browser Blob object
 * - Buffer: Node.js Buffer (when running in Node.js)
 */
type TWBInput = string | File | Blob | Buffer;

/**
 * Options for parsing TWB files
 */
export interface TWBParserOptions {
  /**
   * Whether to include hidden fields in the output
   * Hidden fields typically start with an underscore
   */
  includeHidden?: boolean;
}

/**
 * Error thrown when TWB parsing fails
 */
export class TWBParseError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = "TWBParseError";
  }
}

/**
 * Gets string content from various input types
 */
async function getContentFromInput(input: TWBInput): Promise<string> {
  if (typeof input === "string") {
    return input;
  }

  if (input instanceof Blob || input instanceof File) {
    return await input.text();
  }

  if (typeof Buffer !== "undefined" && input instanceof Buffer) {
    return input.toString("utf-8");
  }

  throw new TWBParseError("Unsupported input type");
}

/**
 * Extracts datasources from the parsed XML structure
 */
function extractDatasources(workbook: any): TWBDatasource[] {
  if (!workbook?.workbook?.datasources?.datasource) {
    return [];
  }

  const datasources = Array.isArray(workbook.workbook.datasources.datasource)
    ? workbook.workbook.datasources.datasource
    : [workbook.workbook.datasources.datasource];

  return datasources.map((ds: any) => {
    // Convert to our type structure
    const result: TWBDatasource = {
      "@_name": ds["@_name"] || "",
      "@_caption": ds["@_caption"],
      "@_inline": ds["@_inline"],
      "@_version": ds["@_version"],
    };

    // Handle connection if present
    if (ds.connection) {
      result.connection = {
        "@_class": ds.connection["@_class"],
        "named-connections": {
          "named-connection":
            ds.connection["named-connections"]?.["named-connection"]?.map(
              (nc: any) => ({
                "@_caption": nc["@_caption"],
                "@_name": nc["@_name"],
                connection: {
                  "@_class": nc.connection["@_class"],
                  "@_cleaning": nc.connection["@_cleaning"],
                  "@_compat": nc.connection["@_compat"],
                  "@_directory": nc.connection["@_directory"],
                  "@_tablename": nc.connection["@_tablename"],
                  "@_workgroup-auth-mode":
                    nc.connection["@_workgroup-auth-mode"],
                },
              })
            ) || [],
        },
        relation: ds.connection.relation,
      };
    }

    // Handle metadata records if present
    if (ds["metadata-records"]?.["metadata-record"]) {
      const records = Array.isArray(ds["metadata-records"]["metadata-record"])
        ? ds["metadata-records"]["metadata-record"]
        : [ds["metadata-records"]["metadata-record"]];

      result["metadata-records"] = {
        "metadata-record": records.map((record: any) => ({
          "@_class": record["@_class"],
          "remote-name": record["remote-name"],
          "remote-type": record["remote-type"],
          "local-name": record["local-name"],
          "local-type": record["local-type"],
          aggregation: record["aggregation"],
          "contains-null": record["contains-null"],
          precision: record["precision"],
          ordinal: record["ordinal"],
        })),
      };
    }

    // Collect all columns from various places
    const allColumns: any[] = [];

    // Direct columns
    if (ds.column) {
      const columns = Array.isArray(ds.column) ? ds.column : [ds.column];
      allColumns.push(...columns);
    }

    // Process columns from metadata records
    if (result["metadata-records"]?.["metadata-record"]) {
      const records = Array.isArray(
        result["metadata-records"]["metadata-record"]
      )
        ? result["metadata-records"]["metadata-record"]
        : [result["metadata-records"]["metadata-record"]];

      records.forEach((record: any) => {
        if (record["@_class"] === "column") {
          const col: TWBRegularColumn = {
            "@_name": `[${record["remote-name"]}]`,
            "@_datatype": record["remote-type"] || "string",
            "@_role":
              record["local-type"] === "quantitative" ? "measure" : "dimension",
            "@_caption": record["local-name"],
            "@_remote-name": record["remote-name"],
            "@_remote-type": record["remote-type"],
            "@_aggregation": record["aggregation"] || "None",
          };
          allColumns.push(col);
        }
      });
    }

    // Process columns from relation structure
    if (ds.connection?.relation) {
      const processRelation = (relation: any) => {
        if (relation.columns?.column) {
          const cols = Array.isArray(relation.columns.column)
            ? relation.columns.column
            : [relation.columns.column];

          cols.forEach((col: any) => {
            const column: TWBRegularColumn = {
              "@_name": `[${col["@_name"]}]`,
              "@_datatype": col["@_datatype"] || "string",
              "@_role":
                col["@_name"]?.toLowerCase().includes("sales") ||
                col["@_name"]?.toLowerCase().includes("profit") ||
                col["@_name"]?.toLowerCase().includes("quantity") ||
                col["@_name"]?.toLowerCase().includes("target")
                  ? "measure"
                  : "dimension",
              "@_caption": col["@_name"],
              "@_remote-name": col["@_name"],
              "@_remote-type": col["@_datatype"] || "string",
              "@_aggregation":
                col["@_name"]?.toLowerCase().includes("sales") ||
                col["@_name"]?.toLowerCase().includes("profit") ||
                col["@_name"]?.toLowerCase().includes("quantity") ||
                col["@_name"]?.toLowerCase().includes("target")
                  ? "Sum"
                  : "None",
            };
            allColumns.push(column);
          });
        }

        // Process nested relations
        if (relation.relation) {
          if (Array.isArray(relation.relation)) {
            relation.relation.forEach(processRelation);
          } else {
            processRelation(relation.relation);
          }
        }
      };

      processRelation(ds.connection.relation);
    }

    // Process all collected columns
    if (allColumns.length > 0) {
      result.column = allColumns.map((col: any) => {
        // Check if it's a calculation or parameter
        if (col.calculation) {
          const calcColumn: TWBCalculationColumn = {
            "@_name": col["@_name"] || "",
            "@_datatype": col["@_datatype"] || "string",
            "@_role": col["@_role"] || "dimension",
            "@_caption": col["@_caption"],
            "@_default-format": col["@_default-format"],
            "@_precision": col["@_precision"],
            "@_contains-null": col["@_contains-null"],
            "@_ordinal": col["@_ordinal"],
            "@_remote-alias": col["@_remote-alias"],
            "@_remote-name": col["@_remote-name"],
            "@_remote-type": col["@_remote-type"],
            calculation: {
              "@_class": "tableau",
              "@_formula": col.calculation["@_formula"] || "",
            },
          };
          return calcColumn;
        } else if (col["@_param-domain-type"]) {
          const paramColumn: TWBParameterColumn = {
            "@_name": col["@_name"] || "",
            "@_datatype": col["@_datatype"] || "string",
            "@_role": col["@_role"] || "dimension",
            "@_caption": col["@_caption"],
            "@_default-format": col["@_default-format"],
            "@_precision": col["@_precision"],
            "@_contains-null": col["@_contains-null"],
            "@_ordinal": col["@_ordinal"],
            "@_remote-alias": col["@_remote-alias"],
            "@_remote-name": col["@_remote-name"],
            "@_remote-type": col["@_remote-type"],
            "@_param-domain-type": col["@_param-domain-type"],
            members: col.members,
            aliases: col.aliases,
          };
          return paramColumn;
        } else {
          return col as TWBRegularColumn;
        }
      });
    }

    return result;
  });
}

/**
 * Parses a TWB file and returns the datasources
 * Works with both browser File objects and Node.js file contents
 */
export async function parseTWB(
  input: TWBInput,
  options: TWBParserOptions = {}
): Promise<TWBDatasource[]> {
  try {
    // Get content as string
    const content = await getContentFromInput(input);

    // Parse XML
    const result = parser.parse(content);

    // Validate basic structure
    if (!result?.workbook) {
      throw new TWBParseError("Invalid TWB file: missing workbook element");
    }

    // Extract datasources
    return extractDatasources(result);
  } catch (error) {
    if (error instanceof TWBParseError) {
      throw error;
    }
    throw new TWBParseError("Failed to parse TWB file", error);
  }
}
