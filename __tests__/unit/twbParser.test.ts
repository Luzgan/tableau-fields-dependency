import fs from "fs";
import path from "path";
import { parseTWB, ensureArray } from "../../src/utils/twbParser";
import {
  ParameterColumn,
  CalculatedColumn,
  DataSourceColumn,
  TWBFile,
  Datasource,
} from "../../src/types/twb.types";

/**
 * TWB Parser Tests
 *
 * Tests all .twb files found in the example-files directory
 */

describe("TWB Parser", () => {
  // Get all .twb files from example-files directory
  const exampleFilesDir = path.join(__dirname, "../../example-files");
  const twbFiles = fs
    .readdirSync(exampleFilesDir)
    .filter((file) => file.endsWith(".twb"));

  // Test each TWB file
  twbFiles.forEach((fileName) => {
    describe(`File: ${fileName}`, () => {
      let parsedFile: TWBFile;
      let datasources: Datasource[];

      beforeAll(async () => {
        const filePath = path.join(exampleFilesDir, fileName);
        const fileContent = fs.readFileSync(filePath, "utf-8");
        parsedFile = await parseTWB(fileContent);
        datasources = ensureArray(parsedFile.workbook.datasources.datasource);
      });

      describe("Workbook Structure", () => {
        test("has required datasources section", () => {
          expect(parsedFile.workbook.datasources).toBeDefined();
          expect(parsedFile.workbook.datasources.datasource).toBeDefined();
        });
      });

      describe("Datasources", () => {
        test("returns non-empty array of datasources", () => {
          expect(datasources).toBeDefined();
          expect(Array.isArray(datasources)).toBe(true);
          expect(datasources.length).toBeGreaterThan(0);
        });

        test("each datasource has required fields", () => {
          datasources.forEach((ds) => {
            expect(ds.name).toBeDefined();
            expect(typeof ds.name).toBe("string");
          });
        });
      });

      describe("Columns", () => {
        let allColumns: (
          | ParameterColumn
          | CalculatedColumn
          | DataSourceColumn
        )[];

        beforeAll(() => {
          allColumns = datasources.flatMap((ds) =>
            ds.column ? ensureArray(ds.column) : []
          );
        });

        test("each column has required base fields", () => {
          allColumns.forEach((col) => {
            expect(col.name).toBeDefined();
            expect(col.datatype).toBeDefined();
            expect(col.role).toBeDefined();
            expect(typeof col.name).toBe("string");
            expect(typeof col.datatype).toBe("string");
            expect(typeof col.role).toBe("string");
          });
        });

        test("calculated columns have formula", () => {
          const calculatedColumns = allColumns.filter(
            (col): col is CalculatedColumn => "calculation" in col
          );

          calculatedColumns.forEach((col) => {
            expect(col.calculation).toBeDefined();
            expect(col.calculation.formula).toBeDefined();
            expect(typeof col.calculation.formula).toBe("string");
          });
        });
      });
    });
  });

  describe("Error handling", () => {
    test("throws error for invalid XML", async () => {
      await expect(parseTWB("invalid xml")).rejects.toThrow();
    });

    test("throws error for unsupported input type", async () => {
      // @ts-ignore - Testing invalid input
      await expect(parseTWB(123)).rejects.toThrow();
    });
  });

  describe("ensureArray", () => {
    test("handles undefined", () => {
      expect(ensureArray(undefined)).toEqual([]);
    });

    test("handles single item", () => {
      expect(ensureArray(1)).toEqual([1]);
    });

    test("handles array", () => {
      expect(ensureArray([1, 2, 3])).toEqual([1, 2, 3]);
    });
  });
});
