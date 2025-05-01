import fs from "fs";
import path from "path";
import { parseTWBSync } from "../../src/utils/twbParser";
import {
  findNodeByReference,
  transformTWBData,
  extractReferences,
} from "../../src/utils/twbTransformer";
import {
  CalculationNode,
  DatasourceNode,
  ParameterNode,
  Node,
  Reference,
} from "../../src/types/app.types";
import { ColumnDataType, ColumnRole } from "../../src/types/enums";

/**
 * Get all .twb files from example-files directory
 */
function getExampleFiles(): string[] {
  const exampleFilesDir = path.join(__dirname, "../../example-files");
  return fs
    .readdirSync(exampleFilesDir)
    .filter((file) => file.endsWith(".twb"));
}

/**
 * Log missing references to a file
 */
function logMissingReferences(
  filename: string,
  calcNode: CalculationNode,
  missingRefs: Reference[],
  availableNodes: string[]
) {
  const logDir = path.join(__dirname, "../../logs");
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  const logFile = path.join(logDir, "missing-references.log");
  const timestamp = new Date().toISOString();
  const logEntry = `
=== ${timestamp} ===
File: ${filename}
Calculation: ${calcNode.name}
Datasource: ${calcNode.datasourceName}
Missing References:
${missingRefs
  .map(
    (ref) =>
      `  - ${ref.matchedText} (Datasource: ${
        ref.targetDatasourceName || "none"
      }, Target: ${ref.targetName})`
  )
  .join("\n")}
Available Nodes: ${availableNodes.join(", ")}
Formula: ${calcNode.calculation}
----------------------------------------
`;

  fs.appendFileSync(logFile, logEntry);
}

describe("TWB Transformer", () => {
  // Test each example file
  getExampleFiles().forEach((filename) => {
    describe(`File: ${filename}`, () => {
      const fileContent = fs.readFileSync(
        path.join(__dirname, "../../example-files", filename),
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
        Array.from(result.nodesById.values()).forEach((node: Node) => {
          expect(node.id).toBeDefined();
          expect(typeof node.id).toBe("string");
          expect(node.name).toBeDefined();
          expect(typeof node.name).toBe("string");
          expect(node.type).toMatch(/^(datasource|calculation|parameter)$/);
          expect(node.displayName).toBeDefined();
          expect(typeof node.displayName).toBe("string");
          expect(node.dataType).toBeDefined();
          expect(Object.values(ColumnDataType)).toContain(node.dataType);
          expect(node.role).toBeDefined();
          expect(Object.values(ColumnRole)).toContain(node.role);
        });
      });

      test("calculation nodes have all referenced nodes", () => {
        const calculationNodes = Array.from(result.nodesById.values()).filter(
          (node): node is CalculationNode => node.type === "calculation"
        );

        calculationNodes.forEach((calcNode) => {
          // Get all references for this calculation node
          const nodeRefs = result.references.filter(
            (ref) => ref.sourceId === calcNode.id
          );

          // Check that each referenced field exists in nodesById
          const missingRefs: Reference[] = [];
          nodeRefs.forEach((ref) => {
            const targetNode = findNodeByReference(result.nodesById, ref);
            if (!targetNode) {
              missingRefs.push(ref);
            }
          });

          // If there are missing fields, log them and throw error
          if (missingRefs.length > 0) {
            const availableNodes = Array.from(result.nodesById.values())
              .map((node) => node.name)
              .sort();

            logMissingReferences(
              filename,
              calcNode,
              missingRefs,
              availableNodes
            );

            const errorMessage = `Calculation "${
              calcNode.name
            }" in file "${filename}" references fields that don't exist: ${missingRefs
              .map((ref) => ref.matchedText)
              .join(", ")}\nAvailable nodes: ${availableNodes.join(", ")}`;
            throw new Error(errorMessage);
          }
        });
      });
    });
  });

  // Mock-based tests
  describe("Mock-based tests", () => {
    test("handles parameter columns correctly", () => {
      const mockTWB = {
        workbook: {
          datasources: {
            datasource: {
              name: "Parameters",
              column: {
                name: "[TestParam]",
                datatype: "string",
                role: "dimension",
                caption: "Test Parameter",
              },
            },
          },
        },
      };

      const result = transformTWBData(mockTWB);
      const nodes = Array.from(result.nodesById.values());
      const paramNode = nodes.find(
        (n): n is ParameterNode => n.type === "parameter"
      );

      expect(paramNode).toBeDefined();
      expect(paramNode?.name).toBe("[TestParam]");
      expect(paramNode?.type).toBe("parameter");
      expect(paramNode?.dataType).toBe(ColumnDataType.String);
      expect(paramNode?.role).toBe(ColumnRole.Dimension);
    });

    test("handles calculation columns correctly", () => {
      const mockTWB = {
        workbook: {
          datasources: {
            datasource: {
              name: "TestDS",
              column: {
                name: "[TestCalc]",
                datatype: "string",
                role: "dimension",
                calculation: {
                  formula: "[Field1] + [Field2]",
                },
              },
            },
          },
        },
      };

      const result = transformTWBData(mockTWB);
      const nodes = Array.from(result.nodesById.values());
      const calcNode = nodes.find(
        (n): n is CalculationNode => n.type === "calculation"
      );

      expect(calcNode).toBeDefined();
      expect(calcNode?.name).toBe("[TestCalc]");
      expect(calcNode?.type).toBe("calculation");
      expect(calcNode?.calculation).toBe("[Field1] + [Field2]");
    });

    test("handles relation columns correctly", () => {
      const mockTWB = {
        workbook: {
          datasources: {
            datasource: {
              name: "TestDS",
              connection: {
                relation: {
                  type: "table" as const,
                  columns: {
                    column: {
                      name: "TestField",
                      datatype: "integer",
                    },
                  },
                },
              },
            },
          },
        },
      };

      const result = transformTWBData(mockTWB);
      const nodes = Array.from(result.nodesById.values());
      const fieldNode = nodes.find(
        (n): n is DatasourceNode => n.type === "datasource"
      );

      expect(fieldNode).toBeDefined();
      expect(fieldNode?.name).toBe("[TestField]");
      expect(fieldNode?.type).toBe("datasource");
      expect(fieldNode?.dataType).toBe(ColumnDataType.Integer);
      expect(fieldNode?.role).toBe(ColumnRole.Measure);
    });

    test("handles column overwrites correctly", () => {
      const mockTWB = {
        workbook: {
          datasources: {
            datasource: {
              name: "TestDS",
              connection: {
                relation: {
                  type: "table" as const,
                  columns: {
                    column: {
                      name: "TestField",
                      datatype: "integer",
                    },
                  },
                },
              },
              column: {
                name: "[TestField]",
                datatype: "string",
                role: "dimension",
                caption: "Overwritten Field",
              },
            },
          },
        },
      };

      const result = transformTWBData(mockTWB);
      const nodes = Array.from(result.nodesById.values());
      const fieldNode = nodes.find(
        (n): n is DatasourceNode => n.type === "datasource"
      );

      expect(fieldNode).toBeDefined();
      expect(fieldNode?.name).toBe("[TestField]");
      expect(fieldNode?.type).toBe("datasource");
      expect(fieldNode?.dataType).toBe(ColumnDataType.String);
      expect(fieldNode?.role).toBe(ColumnRole.Dimension);
      expect(fieldNode?.caption).toBe("Overwritten Field");
    });
  });

  describe("extractReferences", () => {
    it("should handle complex calculations with quoted strings or comments with field references", () => {
      const complexCalculation = `case [Parameters].[Navigation_1p (copy)_1135751564852047874]
when "Production" then 
    IF [Parameters].[Parameter 8]=1 THEN 
        "Up till Apr 2023: 2 x Prod DAC + RTP + 0.33 x PUB + Compensation"+"
"+"From Apr 2023: 4 x Prod DAC + RTP + 0.67 x PUB + Compensation"
    ELSE 'AC + DAC + RTP + 0.67 x PUB + Comp + [Parameters].[Parameter 3]'
    // This is comment with field reference [Parameters].[Parameter 4]
    /* Multiline comment with field reference [Parameters].[Parameter 5] 
    And another field reference [Parameters].[Parameter 6]
    */
    END
when "Compensation" then "Up till Apr 2023: Manual Debriefs + Scorer Debriefs + Supplier Debriefs + Inq RTP + Inq PUB + Quest RTP + Quest PUB + 0.5 x LR Help + CoE + Orientation + Prefilling + Select"+"
"+"From Apr 2023: 2 x Manual Debriefs + 2 x Scorer Debriefs + 2 x Supplier Debriefs + 2 x Inq RTP + 2 x Inq PUB + Quest RTP + Quest PUB + LR Help + [CoE x 2 (Apr 23)] + 2 x Orientation + 2 x Prefilling + Select"
end`;

      const references = extractReferences(complexCalculation);

      // Should only find two references, ignoring everything in quotes
      expect(references).toHaveLength(2);

      // Check first reference
      expect(references[0]).toEqual({
        datasource: "Parameters",
        field: "Navigation_1p (copy)_1135751564852047874",
        matchedText: "[Parameters].[Navigation_1p (copy)_1135751564852047874]",
      });

      // Check second reference
      expect(references[1]).toEqual({
        datasource: "Parameters",
        field: "Parameter 8",
        matchedText: "[Parameters].[Parameter 8]",
      });
    });
  });
});
