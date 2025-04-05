import fs from "fs";
import path from "path";
import { parseTWB } from "../twb-parser";
import { transformTWBData } from "../twb-transformer";
import { ColumnNode, CalculationNode } from "../types";
import {
  TWBDatasource,
  TWBCalculationColumn,
  TWBRegularColumn,
  TWBParameterColumn,
} from "../twb-types";

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
          if (node.formula) {
            expect(typeof node.formula).toBe("string");
          }
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

      test("prints summary of transformed data", () => {
        const nodes = Array.from(result.nodesById.values());
        const columnNodes = nodes.filter(
          (node): node is ColumnNode => node.type === "column"
        );
        const calculationNodes = nodes.filter(
          (node): node is CalculationNode => node.type === "calculation"
        );
        const parameterNodes = calculationNodes.filter(
          (node) => node.paramDomainType
        );

        console.log(`\nFile: ${fileName}`);
        console.log(`Total nodes: ${nodes.length}`);
        console.log(`Column nodes: ${columnNodes.length}`);
        console.log(`Calculation nodes: ${calculationNodes.length}`);
        console.log(`Parameter nodes: ${parameterNodes.length}`);
        console.log(`Total references: ${result.references.length}`);
        console.log(
          `Direct references: ${
            result.references.filter((ref) => ref.type === "direct").length
          }`
        );
        console.log(
          `Indirect references: ${
            result.references.filter((ref) => ref.type === "indirect").length
          }`
        );

        // Log sample nodes
        if (columnNodes.length > 0) {
          console.log("\nSample column node:", columnNodes[0]);
        }
        if (calculationNodes.length > 0) {
          const calcSample = calculationNodes.find((n) => n.formula);
          if (calcSample) {
            console.log("\nSample calculation node:", calcSample);
          }
        }
        if (parameterNodes.length > 0) {
          console.log("\nSample parameter node:", parameterNodes[0]);
        }
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
});
