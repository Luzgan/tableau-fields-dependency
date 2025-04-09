import { TWBFile } from "../types/twb.types";
import { XMLParser } from "fast-xml-parser";

// Configure parser with the same options as in FileUpload.tsx
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  allowBooleanAttributes: true,
  preserveOrder: false,
});

/**
 * Ensures that a value is always an array
 * If the value is undefined, returns an empty array
 * If the value is an array, returns it as is
 * If the value is a single item, wraps it in an array
 */
export function ensureArray<T>(value: T | T[] | undefined): T[] {
  if (!value) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}

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
 * Core TWB parsing logic shared between sync and async versions
 * @internal
 */
function parseContent(content: string): TWBFile {
  try {
    // Parse XML
    const result = parser.parse(content);

    // Validate basic structure
    if (!result?.workbook) {
      throw new TWBParseError("Invalid TWB file: missing workbook element");
    }

    return result;
  } catch (error) {
    if (error instanceof TWBParseError) {
      throw error;
    }
    throw new TWBParseError("Failed to parse TWB file", error);
  }
}

/**
 * Parses a TWB file and returns the complete workbook structure
 * Works with both browser File objects and Node.js file contents
 */
export async function parseTWB(input: TWBInput): Promise<TWBFile> {
  // Get content as string
  const content = await getContentFromInput(input);
  return parseContent(content);
}

/**
 * Synchronously parses a TWB file from string content
 * Use this when you have the XML content as a string
 * For File/Blob/Buffer inputs, use the async parseTWB instead
 */
export function parseTWBSync(content: string): TWBFile {
  return parseContent(content);
}
