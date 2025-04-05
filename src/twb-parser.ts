import { TWBDatasource } from "./twb-types";
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
    };

    // Handle columns
    if (ds.column) {
      const columns = Array.isArray(ds.column) ? ds.column : [ds.column];
      result.column = columns.map((col: any) => {
        const baseColumn = {
          "@_name": col["@_name"] || "",
          "@_datatype": col["@_datatype"] || "",
          "@_role": col["@_role"] || "",
          "@_caption": col["@_caption"],
          "@_default-format": col["@_default-format"],
          "@_precision": col["@_precision"],
          "@_contains-null": col["@_contains-null"],
          "@_ordinal": col["@_ordinal"],
          "@_remote-alias": col["@_remote-alias"],
          "@_remote-name": col["@_remote-name"],
          "@_remote-type": col["@_remote-type"],
        };

        // Check if it's a calculation
        if (col.calculation || col["@_param-domain-type"]) {
          return {
            ...baseColumn,
            "@_param-domain-type": col["@_param-domain-type"] as
              | "list"
              | "range"
              | undefined,
            calculation: col.calculation
              ? {
                  "@_class": "tableau",
                  "@_formula": col.calculation["@_formula"] || "",
                }
              : undefined,
          };
        }

        // Regular column
        return {
          ...baseColumn,
          "@_aggregation": col["@_aggregation"] || "None",
        };
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
