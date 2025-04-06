import fs from "fs";
import path from "path";
import { parseTWB } from "../../src/utils/twbParser";
import {
  TWBRegularColumn,
  TWBCalculationColumn,
  isCalculationColumn,
} from "../../src/types/twb.types";

const TEST_FILES = [
  "test_book.twb",
  "test.twb",
  "Validation _ S2 2023 Combined Results (2).twb",
];

describe("TWB Parser", () => {
  // Test each example file
  TEST_FILES.forEach((fileName) => {
    describe(`File: ${fileName}`, () => {
      let datasources: Awaited<ReturnType<typeof parseTWB>>;

      beforeAll(async () => {
        try {
          const filePath = path.join(
            __dirname,
            "../../example-files",
            fileName
          );
          const fileContent = fs.readFileSync(filePath, "utf-8");
          datasources = await parseTWB(fileContent);
        } catch (error) {
          console.error(`Error loading file ${fileName}:`, error);
          throw error;
        }
      });

      test("returns non-empty array of datasources", () => {
        expect(datasources).toBeDefined();
        expect(Array.isArray(datasources)).toBe(true);
        expect(datasources.length).toBeGreaterThan(0);
      });

      test("each datasource has required fields", () => {
        datasources.forEach((ds) => {
          expect(ds["@_name"]).toBeDefined();
          expect(typeof ds["@_name"]).toBe("string");
        });
      });

      describe("columns validation", () => {
        test("each regular column has required fields", () => {
          // Collect all columns from all datasources
          const allColumns = datasources.flatMap((ds) =>
            Array.isArray(ds.column) ? ds.column : ds.column ? [ds.column] : []
          );

          const regularColumns = allColumns.filter(
            (col): col is TWBRegularColumn => !isCalculationColumn(col)
          );

          regularColumns.forEach((col) => {
            // Required base fields
            expect(col["@_name"]).toBeDefined();
            expect(col["@_datatype"]).toBeDefined();
            expect(col["@_role"]).toBeDefined();

            // Required for regular columns
            expect(col["@_aggregation"]).toBeDefined();

            // Type checks
            expect(typeof col["@_name"]).toBe("string");
            expect(typeof col["@_datatype"]).toBe("string");
            expect(typeof col["@_role"]).toBe("string");
            expect(typeof col["@_aggregation"]).toBe("string");
          });
        });

        test("each calculation column has required fields", () => {
          const allColumns = datasources.flatMap((ds) =>
            Array.isArray(ds.column) ? ds.column : ds.column ? [ds.column] : []
          );

          const calculationColumns = allColumns.filter(
            (col): col is TWBCalculationColumn => isCalculationColumn(col)
          );

          calculationColumns.forEach((col) => {
            // Required base fields
            expect(col["@_name"]).toBeDefined();
            expect(col["@_datatype"]).toBeDefined();
            expect(col["@_role"]).toBeDefined();

            // If it has a calculation, check its required fields
            if (col.calculation) {
              expect(col.calculation["@_class"]).toBe("tableau");
              expect(col.calculation["@_formula"]).toBeDefined();
              expect(typeof col.calculation["@_formula"]).toBe("string");
            }

            // If it has param-domain-type, check it's a valid value
            if (col["@_param-domain-type"]) {
              expect(["list", "range"]).toContain(col["@_param-domain-type"]);
            }

            // Type checks
            expect(typeof col["@_name"]).toBe("string");
            expect(typeof col["@_datatype"]).toBe("string");
            expect(typeof col["@_role"]).toBe("string");
          });
        });

        test("prints summary of found columns", () => {
          const allColumns = datasources.flatMap((ds) =>
            Array.isArray(ds.column) ? ds.column : ds.column ? [ds.column] : []
          );

          const regularColumns = allColumns.filter(
            (col): col is TWBRegularColumn => !isCalculationColumn(col)
          );
          const calculationColumns = allColumns.filter(
            (col): col is TWBCalculationColumn => isCalculationColumn(col)
          );
          const parameterColumns = calculationColumns.filter(
            (col) => col["@_param-domain-type"]
          );

          console.log(`\nFile: ${fileName}`);
          console.log(`Total columns: ${allColumns.length}`);
          console.log(`Regular columns: ${regularColumns.length}`);
          console.log(`Calculation columns: ${calculationColumns.length}`);
          console.log(`Parameter columns: ${parameterColumns.length}`);

          // Log a sample of each type if available
          if (regularColumns.length > 0) {
            console.log("\nSample regular column:", {
              name: regularColumns[0]["@_name"],
              datatype: regularColumns[0]["@_datatype"],
              role: regularColumns[0]["@_role"],
              aggregation: regularColumns[0]["@_aggregation"],
            });
          }

          if (calculationColumns.length > 0) {
            const calcSample = calculationColumns.find((c) => c.calculation);
            if (calcSample?.calculation) {
              console.log("\nSample calculation column:", {
                name: calcSample["@_name"],
                datatype: calcSample["@_datatype"],
                role: calcSample["@_role"],
                formula: calcSample.calculation["@_formula"],
              });
            }
          }

          if (parameterColumns.length > 0) {
            console.log("\nSample parameter column:", {
              name: parameterColumns[0]["@_name"],
              datatype: parameterColumns[0]["@_datatype"],
              role: parameterColumns[0]["@_role"],
              paramDomainType: parameterColumns[0]["@_param-domain-type"],
            });
          }
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
});
