import fs from "fs";
import path from "path";
import { parseTWB } from "../../src/utils/twbParser";
import { transformTWBData } from "../../src/utils/twbTransformer";
import { ColumnNode, CalculationNode } from "../../src/types/app.types";
import {
  TWBDatasource,
  TWBRegularColumn,
  TWBCalculationColumn,
  TWBParameterColumn,
} from "../../src/types/twb.types";

const TEST_FILES = [
  "test_book.twb",
  "test.twb",
  "Validation _ S2 2023 Combined Results (2).twb",
];

describe("TWB Transformer", () => {
  // Test each example file
  TEST_FILES.forEach((fileName) => {
    describe(`File: ${fileName}`, () => {
      const filePath = path.join(__dirname, "../../example-files", fileName);
      const fileContent = fs.readFileSync(filePath, "utf-8");
      let result: Awaited<ReturnType<typeof transformTWBData>>;

      beforeAll(async () => {
        const datasources = await parseTWB(fileContent);
        result = transformTWBData(datasources, fileName);
      });

      test("returns FileData with correct structure", () => {
        expect(result.filename).toBe(fileName);
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
            expect(["string", "integer", "real", "date", "boolean"]).toContain(
              node.dataType
            );
          }
          if (node.role) {
            expect(["measure", "dimension"]).toContain(node.role);
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
          if (node.paramDomainType) {
            expect(["list", "range"]).toContain(node.paramDomainType);
          }
          if (node.class) {
            expect(node.class).toBe("tableau");
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
      const datasources: TWBDatasource[] = [
        {
          "@_name": "test",
          column: [
            {
              "@_name": "col1",
              "@_datatype": "string",
              "@_role": "dimension",
              "@_aggregation": "None",
            } as TWBRegularColumn,
            {
              "@_name": "col2",
              "@_datatype": "real",
              "@_role": "measure",
              calculation: {
                "@_class": "tableau",
                "@_formula": "[col1] * 2",
              },
            } as TWBCalculationColumn,
            {
              "@_name": "param1",
              "@_datatype": "integer",
              "@_role": "measure",
              "@_param-domain-type": "list",
              members: {
                member: [{ value: "1" }, { value: "2" }],
              },
            } as TWBParameterColumn,
          ],
        },
      ];

      const result = transformTWBData(datasources, "test.twb");
      const nodes = Array.from(result.nodesById.values());

      // Verify each node has a role
      nodes.forEach((node) => {
        expect(node.role).toBeDefined();
        expect(["measure", "dimension"]).toContain(node.role);
      });

      // Verify specific roles
      const col1 = nodes.find((n) => n.name === "col1");
      const col2 = nodes.find((n) => n.name === "col2");
      const param1 = nodes.find((n) => n.name === "param1");

      expect(col1?.role).toBe("dimension");
      expect(col2?.role).toBe("measure");
      expect(param1?.role).toBe("measure");
    });

    test("throws error when role is missing", () => {
      const datasources: TWBDatasource[] = [
        {
          "@_name": "test",
          column: [
            {
              "@_name": "col1",
              "@_datatype": "string",
              "@_aggregation": "None",
            } as TWBRegularColumn,
          ],
        },
      ];

      expect(() => transformTWBData(datasources, "test.twb")).toThrow(
        "Role is required"
      );
    });
  });

  describe("HTML Entity Decoding", () => {
    it("should properly decode HTML entities in calculations", () => {
      const datasources: TWBDatasource[] = [
        {
          "@_name": "test_ds",
          column: [
            {
              "@_name": "[Test Calculation]",
              "@_role": "measure",
              "@_datatype": "string",
              calculation: {
                "@_class": "tableau",
                "@_formula":
                  'case [Role]&#13;&#10;when "D" then "AchievementAA"&#13;&#10;when "S" then "QCF AAA"&#13;&#10;when "T" then "QCF BAA"&#13;&#10;when "V" then "QCF Feedback receivedAA"&#13;&#10;when "Z" then "QCF Feedback providedAA"&#13;&#10;end',
              },
            },
          ],
        },
      ];

      const result = transformTWBData(datasources, "test.twb");
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
      const datasources: TWBDatasource[] = [
        {
          "@_name": "test_ds",
          column: [
            {
              "@_name": "[HTML Test]",
              "@_role": "measure",
              "@_datatype": "string",
              calculation: {
                "@_class": "tableau",
                "@_formula":
                  "IF [Value] &lt; 10 &amp;&amp; [Name] = &quot;Test&quot; THEN &apos;Yes&apos; END",
              },
            },
          ],
        },
      ];

      const result = transformTWBData(datasources, "test.twb");
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
    it("should generate URL-safe node IDs", () => {
      const testData: TWBDatasource[] = [
        {
          "@_name": "Test Datasource",
          column: [
            {
              "@_name": "[Test Column]",
              "@_role": "dimension",
              "@_datatype": "string",
            } as TWBRegularColumn,
          ],
        },
      ];

      const result = transformTWBData(testData, "test.twb");
      const nodeId = Array.from(result.nodesById.values())[0].id;

      // Check that the ID only contains URL-safe characters
      expect(nodeId).toMatch(/^[A-Za-z0-9_-]+$/);

      // Check that the ID is consistent
      const secondResult = transformTWBData(testData, "test.twb");
      expect(Array.from(secondResult.nodesById.values())[0].id).toBe(nodeId);

      // Check that the ID format is correct (datasourceName--columnName without brackets)
      expect(nodeId).toBe("Test-Datasource--Test-Column");
    });
  });
});
