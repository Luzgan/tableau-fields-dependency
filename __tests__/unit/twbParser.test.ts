import fs from "fs";
import path from "path";
import { parseTWB, ensureArray } from "../../src/utils/twbParser";
import {
  TWBRegularColumn,
  TWBCalculationColumn,
  TWBParameterColumn,
  TWBInternalColumn,
  TWBFile,
  TWBDatasource,
  isCalculationColumn,
  isParameterColumn,
  isDataSourceColumn,
  isInternalColumn,
} from "../../src/types/twb.types";
import { ColumnDataType, ColumnRole } from "../../src/types/enums";

/**
 * TWB Parser Tests
 *
 * Note: These tests intentionally ignore internal Tableau columns (those with names containing
 * "[__tableau_internal_object_id__]"). These internal columns may use special datatypes
 * (like "table") that are not part of the public TWB file format and are not relevant
 * for our field dependency analysis.
 */

const TEST_FILES = [
  "test_book.twb",
  "test.twb",
  "Validation _ S2 2023 Combined Results (2).twb",
];

describe("TWB Parser", () => {
  // Test each example file
  TEST_FILES.forEach((fileName) => {
    describe(`File: ${fileName}`, () => {
      let parsedFile: TWBFile;
      let datasources: TWBDatasource[];

      beforeAll(async () => {
        try {
          const filePath = path.join(
            __dirname,
            "../../example-files",
            fileName
          );
          const fileContent = fs.readFileSync(filePath, "utf-8");
          parsedFile = await parseTWB(fileContent);
          datasources = ensureArray(parsedFile.workbook.datasources.datasource);
        } catch (error) {
          throw error;
        }
      });

      describe("Workbook Structure", () => {
        test("has required workbook attributes", () => {
          const workbook = parsedFile.workbook;
          expect(workbook["@_original-version"]).toBeDefined();
          expect(workbook["@_version"]).toBeDefined();
          expect(workbook["@_source-build"]).toBeDefined();
          expect(workbook["@_source-platform"]).toBeDefined();
        });

        test("has required sections", () => {
          const workbook = parsedFile.workbook;
          expect(workbook["document-format-change-manifest"]).toBeDefined();
          expect(workbook.preferences).toBeDefined();
          expect(workbook.datasources).toBeDefined();
        });

        test("preferences have required structure", () => {
          const preferences = parsedFile.workbook.preferences;
          expect(preferences.preference).toBeDefined();
          const prefs = ensureArray(preferences.preference);
          prefs.forEach((pref) => {
            expect(pref["@_name"]).toBeDefined();
            expect(pref["@_value"]).toBeDefined();
          });
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
            expect(ds["@_name"]).toBeDefined();
            expect(typeof ds["@_name"]).toBe("string");
            expect(ds["@_version"]).toBeDefined();
          });
        });
      });

      describe("Column Types", () => {
        let allColumns: (
          | TWBRegularColumn
          | TWBCalculationColumn
          | TWBParameterColumn
          | TWBInternalColumn
        )[];

        beforeAll(() => {
          allColumns = datasources.flatMap((ds) => ensureArray(ds.column));
        });

        test("each regular column has required fields", () => {
          const regularColumns = allColumns.filter(isDataSourceColumn);

          regularColumns.forEach((col) => {
            // Required base fields
            expect(col["@_name"]).toBeDefined();
            expect(col["@_datatype"]).toBeDefined();
            expect(col["@_role"]).toBeDefined();

            // Required for regular columns
            expect(col["@_aggregation"]).toBeDefined();
            expect(col["@_remote-name"]).toBeDefined();
            expect(col["@_remote-type"]).toBeDefined();

            // Type checks
            expect(typeof col["@_name"]).toBe("string");
            expect(typeof col["@_datatype"]).toBe("string");
            expect(typeof col["@_role"]).toBe("string");
            expect(typeof col["@_aggregation"]).toBe("string");
          });
        });

        test("each calculation column has required fields", () => {
          const calculationColumns = allColumns.filter(isCalculationColumn);

          calculationColumns.forEach((col) => {
            // Required base fields
            expect(col["@_name"]).toBeDefined();
            expect(col["@_datatype"]).toBeDefined();
            expect(col["@_role"]).toBeDefined();

            // Required calculation fields
            expect(col.calculation["@_class"]).toBe("tableau");
            expect(col.calculation["@_formula"]).toBeDefined();
            expect(typeof col.calculation["@_formula"]).toBe("string");
          });
        });

        test("each parameter column has required fields", () => {
          const parameterColumns = allColumns.filter(isParameterColumn);

          parameterColumns.forEach((col) => {
            // Required base fields
            expect(col["@_name"]).toBeDefined();
            expect(col["@_datatype"]).toBeDefined();
            expect(col["@_role"]).toBeDefined();

            // Required parameter fields
            expect(col["@_param-domain-type"]).toBeDefined();
            expect(["list", "range"]).toContain(col["@_param-domain-type"]);

            // Check list parameters
            if (col["@_param-domain-type"] === "list" && col.members) {
              ensureArray(col.members.member).forEach((member) => {
                expect(member["@_value"]).toBeDefined();
              });
            }

            // Check range parameters
            if (col["@_param-domain-type"] === "range" && col.range) {
              expect(col.range["@_min"]).toBeDefined();
              expect(col.range["@_max"]).toBeDefined();
            }
          });
        });

        test("data types are valid", () => {
          const validTypes = Object.values(ColumnDataType);

          allColumns.forEach((col) => {
            const datatype = col["@_datatype"].toLowerCase() as ColumnDataType;
            expect(validTypes).toContain(datatype);
          });
        });

        test("internal columns have correct structure", () => {
          const internalColumns = allColumns.filter(isInternalColumn);

          internalColumns.forEach((col) => {
            expect(col["@_name"]).toMatch(/^\[__tableau_internal_object_id__]/);
            expect(col["@_datatype"].toLowerCase()).toBe("table");
          });
        });

        test("roles are valid", () => {
          const validRoles = Object.values(ColumnRole);

          allColumns.forEach((col) => {
            expect(validRoles).toContain(col["@_role"].toLowerCase());
          });
        });
      });
    });
  });

  describe("Error handling", () => {
    test("throws TWBParseError for invalid XML", async () => {
      await expect(parseTWB("invalid xml")).rejects.toThrow();
    });

    test("throws TWBParseError for unsupported input type", async () => {
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
