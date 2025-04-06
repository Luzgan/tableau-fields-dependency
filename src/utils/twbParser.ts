import { TWBDatasource, TWBFile } from "../types/twb.types";
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
function extractDatasources(workbook: TWBFile): TWBDatasource[] {
  if (!workbook?.workbook?.datasources?.datasource) {
    return [];
  }

  const datasources = Array.isArray(workbook.workbook.datasources.datasource)
    ? workbook.workbook.datasources.datasource
    : [workbook.workbook.datasources.datasource];

  return datasources;
}

/**
 * Parses a TWB file and returns the datasources
 * Works with both browser File objects and Node.js file contents
 */
export async function parseTWB(input: TWBInput): Promise<TWBDatasource[]> {
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
