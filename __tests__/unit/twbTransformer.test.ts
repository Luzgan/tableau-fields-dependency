import fs from "fs";
import path from "path";
import { parseTWBSync } from "../../src/utils/twbParser";
import { transformTWBData } from "../../src/utils/twbTransformer";
import { ColumnNode, CalculationNode } from "../../src/types/app.types";
import {
  TWBDatasource,
  TWBRegularColumn,
  TWBParameterColumn,
  TWBFile,
  TWBColumn,
} from "../../src/types/twb.types";
import {
  ColumnDataType,
  ColumnRole,
  ColumnAggregationType,
} from "../../src/types/enums";
import { readFileSync } from "fs";
import { join } from "path";

/**
 * Creates a mock TWB file with consistent structure
 * @param datasources Array of datasources to include in the file
 * @returns Mock TWB file
 */
function createMockTWBFile(datasources: TWBDatasource[]): TWBFile {
  return {
    workbook: {
      "@_original-version": "18.1",
      "@_version": "18.1",
      "@_source-build": "2022.1.0 (20221.22.0313.1202)",
      "@_source-platform": "mac",
      "@_xmlns:user": "http://www.tableausoftware.com/xml/user",
      "document-format-change-manifest": {},
      preferences: {
        preference: [],
      },
      datasources: {
        datasource: datasources,
      },
    },
  };
}

const TEST_FILES = [
  "test_book.twb",
  "test.twb",
  "Validation _ S2 2023 Combined Results (2).twb",
];

describe("TWB Transformer", () => {
  // Test each example file
  TEST_FILES.forEach((filename) => {
    describe(`File: ${filename}`, () => {
      const fileContent = readFileSync(
        join(__dirname, "..", "..", "example-files", filename),
        "utf-8"
      );
      const parsedFile = parseTWBSync(fileContent);
      const result = transformTWBData(parsedFile);

      test("returns FileData with correct structure", () => {
        expect(result).toHaveProperty("nodesById");
        expect(result).toHaveProperty("references");
        expect(result.nodesById).toBeInstanceOf(Map);
        expect(Array.isArray(result.references)).toBe(true);
      });

      test("each node has required base fields", () => {
        Array.from(result.nodesById.values()).forEach((node) => {
          expect(node.id).toBeDefined();
          expect(typeof node.id).toBe("string");
          expect(node.name).toBeDefined();
          expect(typeof node.name).toBe("string");
          expect(node.type).toMatch(/^(column|calculation|parameter)$/);
          expect(node.displayName).toBeDefined();
          expect(typeof node.displayName).toBe("string");

          // Optional but typed fields
          if (node.dataType) {
            expect(Object.values(ColumnDataType)).toContain(node.dataType);
          }
          if (node.role) {
            expect(Object.values(ColumnRole)).toContain(node.role);
          }
        });
      });

      test("displayName is correctly computed", () => {
        Array.from(result.nodesById.values()).forEach((node) => {
          if (node.caption) {
            expect(node.displayName).toBe(node.caption);
          } else if (node.name.startsWith("[") && node.name.endsWith("]")) {
            expect(node.displayName).toBe(node.name.slice(1, -1));
          } else {
            expect(node.displayName).toBe(node.name);
          }
        });
      });

      test("column nodes have correct structure", () => {
        const columnNodes = Array.from(result.nodesById.values()).filter(
          (node): node is ColumnNode => node.type === "column"
        );

        columnNodes.forEach((node) => {
          expect(node.type).toBe("column");

          // Optional but typed fields
          if (node.aggregation) {
            expect(["Sum", "Count", "Year", "None"]).toContain(
              node.aggregation
            );
          }
          if (node.precision !== undefined) {
            expect(typeof node.precision).toBe("number");
          }
          if (node.containsNull !== undefined) {
            expect(typeof node.containsNull).toBe("boolean");
          }
          if (node.ordinal !== undefined) {
            expect(typeof node.ordinal).toBe("number");
          }
        });
      });

      test("calculation nodes have correct structure", () => {
        const calculationNodes = Array.from(result.nodesById.values()).filter(
          (node): node is CalculationNode => node.type === "calculation"
        );

        calculationNodes.forEach((node) => {
          expect(node.type).toBe("calculation");

          // Optional but typed fields
          if (node.calculation) {
            expect(typeof node.calculation).toBe("string");
          }
        });
      });

      test("references are correctly structured", () => {
        result.references.forEach((ref) => {
          expect(ref.sourceId).toBeDefined();
          expect(typeof ref.sourceId).toBe("string");
          expect(ref.targetId).toBeDefined();
          expect(typeof ref.targetId).toBe("string");
          expect(["direct", "indirect"]).toContain(ref.type);
        });
      });
    });
  });

  describe("Role handling", () => {
    test("all nodes have a role", () => {
      const testData = createMockTWBFile([
        {
          "@_name": "test",
          column: [
            {
              "@_name": "col1",
              "@_datatype": ColumnDataType.String,
              "@_role": ColumnRole.Dimension,
              "@_aggregation": ColumnAggregationType.None,
              "@_remote-name": "col1",
              "@_remote-type": "string",
              "@_ordinal": "1",
              "@_remote-alias": "col1",
            } as TWBRegularColumn,
            {
              "@_name": "col2",
              "@_datatype": ColumnDataType.Integer,
              "@_role": ColumnRole.Measure,
              "@_aggregation": ColumnAggregationType.Sum,
              "@_remote-name": "col2",
              "@_remote-type": "integer",
              "@_ordinal": "2",
              "@_remote-alias": "col2",
            } as TWBRegularColumn,
            {
              "@_name": "param1",
              "@_datatype": ColumnDataType.Integer,
              "@_role": ColumnRole.Measure,
              "@_param-domain-type": "list",
            } as TWBParameterColumn,
          ],
        },
      ]);

      const result = transformTWBData(testData);
      const nodes = Array.from(result.nodesById.values());
      const col1 = nodes.find((n) => n.name === "col1");
      const col2 = nodes.find((n) => n.name === "col2");
      const param1 = nodes.find((n) => n.name === "param1");

      expect(col1?.role).toBe(ColumnRole.Dimension);
      expect(col2?.role).toBe(ColumnRole.Measure);
      expect(param1?.role).toBe(ColumnRole.Measure);
    });

    test("throws error when role is missing", () => {
      const testData = createMockTWBFile([
        {
          "@_name": "test",
          column: [
            {
              "@_name": "col1",
              "@_datatype": ColumnDataType.String,
              "@_aggregation": ColumnAggregationType.None,
              "@_remote-name": "col1",
              "@_remote-type": "string",
              "@_ordinal": "1",
              "@_remote-alias": "col1",
            } as TWBRegularColumn,
          ],
        },
      ]);

      expect(() => transformTWBData(testData)).toThrow("Role is required");
    });
  });

  describe("HTML Entity Decoding", () => {
    it("should properly decode HTML entities in calculations", () => {
      const testData = createMockTWBFile([
        {
          "@_name": "test_ds",
          column: [
            {
              "@_name": "[Test Calculation]",
              "@_role": ColumnRole.Measure,
              "@_datatype": ColumnDataType.String,
              calculation: {
                "@_class": "tableau",
                "@_formula":
                  'case [Role]&#13;&#10;when "D" then "AchievementAA"&#13;&#10;when "S" then "QCF AAA"&#13;&#10;when "T" then "QCF BAA"&#13;&#10;when "V" then "QCF Feedback receivedAA"&#13;&#10;when "Z" then "QCF Feedback providedAA"&#13;&#10;end',
              },
            },
          ],
        },
      ]);

      const result = transformTWBData(testData);
      const nodes = Array.from(result.nodesById.values());
      const calcNode = nodes.find((n) => n.name === "[Test Calculation]");

      expect(calcNode).toBeDefined();
      expect(calcNode?.type).toBe("calculation");
      if (calcNode?.type === "calculation") {
        const expectedFormula =
          "case [Role]\r\n" +
          'when "D" then "AchievementAA"\r\n' +
          'when "S" then "QCF AAA"\r\n' +
          'when "T" then "QCF BAA"\r\n' +
          'when "V" then "QCF Feedback receivedAA"\r\n' +
          'when "Z" then "QCF Feedback providedAA"\r\n' +
          "end";

        expect(calcNode.calculation).toBe(expectedFormula);
      }
    });

    it("should handle other HTML entities in calculations", () => {
      const testData = createMockTWBFile([
        {
          "@_name": "test_ds",
          column: [
            {
              "@_name": "[HTML Test]",
              "@_role": ColumnRole.Measure,
              "@_datatype": ColumnDataType.String,
              calculation: {
                "@_class": "tableau",
                "@_formula":
                  "IF [Value] &lt; 10 &amp;&amp; [Name] = &quot;Test&quot; THEN &apos;Yes&apos; END",
              },
            },
          ],
        },
      ]);

      const result = transformTWBData(testData);
      const nodes = Array.from(result.nodesById.values());
      const calcNode = nodes.find((n) => n.name === "[HTML Test]");

      expect(calcNode).toBeDefined();
      expect(calcNode?.type).toBe("calculation");
      if (calcNode?.type === "calculation") {
        expect(calcNode.calculation).toBe(
          "IF [Value] < 10 && [Name] = \"Test\" THEN 'Yes' END"
        );
      }
    });
  });

  describe("Node ID Generation", () => {
    test("should generate URL-safe node IDs", () => {
      const testData = createMockTWBFile([
        {
          "@_name": "Test/Data:Source",
          column: [
            {
              "@_name": "[Special:Field/Name]",
              "@_datatype": ColumnDataType.String,
              "@_role": ColumnRole.Dimension,
              "@_aggregation": ColumnAggregationType.None,
              "@_remote-name": "field",
              "@_remote-type": "string",
              "@_ordinal": "1",
              "@_remote-alias": "field",
            } as TWBRegularColumn,
          ],
        },
      ]);

      const result = transformTWBData(testData);
      const nodeId = Array.from(result.nodesById.values())[0].id;

      // Check that the ID only contains URL-safe characters
      expect(nodeId).toMatch(/^[A-Za-z0-9_-]+$/);
      // Check that special characters were properly handled
      expect(nodeId).toBe("Test-DataSource--SpecialField-Name");
    });
  });
});
