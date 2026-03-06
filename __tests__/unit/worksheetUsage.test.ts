import fs from "fs";
import path from "path";
import { parseTWBSync } from "../../src/utils/twbParser";
import { transformTWBData } from "../../src/utils/twbTransformer";
import { generateNodeId } from "../../src/utils/twbTransformer";

describe("Worksheet field usage", () => {
  describe("usedFieldIds structure", () => {
    test("transformTWBData returns usedFieldIds as a Set", () => {
      const mockTWB = {
        workbook: {
          datasources: {
            datasource: {
              name: "TestDS",
              connection: {
                relation: {
                  type: "table" as const,
                  columns: {
                    column: { name: "Field1", datatype: "string" },
                  },
                },
              },
            },
          },
        },
      };

      const result = transformTWBData(mockTWB);
      expect(result.usedFieldIds).toBeInstanceOf(Set);
    });

    test("fields not in any worksheet or calculation are not in usedFieldIds", () => {
      const mockTWB = {
        workbook: {
          datasources: {
            datasource: {
              name: "TestDS",
              connection: {
                relation: {
                  type: "table" as const,
                  columns: {
                    column: [
                      { name: "UsedField", datatype: "string" },
                      { name: "UnusedField", datatype: "string" },
                    ],
                  },
                },
              },
            },
          },
          worksheets: {
            worksheet: {
              name: "Sheet1",
              table: {
                view: {
                  "datasource-dependencies": {
                    datasource: "TestDS",
                    "column-instance": {
                      column: "[UsedField]",
                      derivation: "None",
                      name: "[none:UsedField:nk]",
                      type: "nominal",
                    },
                  },
                },
              },
            },
          },
        },
      };

      const result = transformTWBData(mockTWB);
      const usedId = generateNodeId("TestDS", "[UsedField]");
      const unusedId = generateNodeId("TestDS", "[UnusedField]");

      expect(result.usedFieldIds.has(usedId)).toBe(true);
      expect(result.usedFieldIds.has(unusedId)).toBe(false);
    });

    test("fields referenced by calculations are in usedFieldIds", () => {
      const mockTWB = {
        workbook: {
          datasources: {
            datasource: {
              name: "TestDS",
              connection: {
                relation: {
                  type: "table" as const,
                  columns: {
                    column: { name: "BaseField", datatype: "integer" },
                  },
                },
              },
              column: {
                name: "[CalcField]",
                datatype: "integer",
                role: "measure",
                calculation: {
                  formula: "[BaseField] * 2",
                },
              },
            },
          },
        },
      };

      const result = transformTWBData(mockTWB);
      const baseId = generateNodeId("TestDS", "[BaseField]");
      const calcId = generateNodeId("TestDS", "[CalcField]");

      expect(result.usedFieldIds.has(baseId)).toBe(true);
      expect(result.usedFieldIds.has(calcId)).toBe(true);
    });

    test("calculation source nodes are in usedFieldIds", () => {
      const mockTWB = {
        workbook: {
          datasources: {
            datasource: {
              name: "TestDS",
              column: {
                name: "[OrphanCalc]",
                datatype: "integer",
                role: "measure",
                calculation: {
                  formula: "1 + 1",
                },
              },
            },
          },
          worksheets: {
            worksheet: {
              name: "Sheet1",
              table: {
                view: {
                  "datasource-dependencies": {
                    datasource: "TestDS",
                    "column-instance": {
                      column: "[OrphanCalc]",
                      derivation: "User",
                      name: "[usr:OrphanCalc:qk]",
                      type: "quantitative",
                    },
                  },
                },
              },
            },
          },
        },
      };

      const result = transformTWBData(mockTWB);
      const calcId = generateNodeId("TestDS", "[OrphanCalc]");
      expect(result.usedFieldIds.has(calcId)).toBe(true);
    });

    test("handles multiple worksheets with multiple datasource-dependencies", () => {
      const mockTWB = {
        workbook: {
          datasources: {
            datasource: [
              {
                name: "DS1",
                connection: {
                  relation: {
                    type: "table" as const,
                    columns: {
                      column: [
                        { name: "A", datatype: "string" },
                        { name: "B", datatype: "string" },
                      ],
                    },
                  },
                },
              },
              {
                name: "DS2",
                connection: {
                  relation: {
                    type: "table" as const,
                    columns: {
                      column: [
                        { name: "C", datatype: "string" },
                        { name: "D", datatype: "string" },
                      ],
                    },
                  },
                },
              },
            ],
          },
          worksheets: {
            worksheet: [
              {
                name: "Sheet1",
                table: {
                  view: {
                    "datasource-dependencies": {
                      datasource: "DS1",
                      "column-instance": {
                        column: "[A]",
                        derivation: "None",
                        name: "[none:A:nk]",
                        type: "nominal",
                      },
                    },
                  },
                },
              },
              {
                name: "Sheet2",
                table: {
                  view: {
                    "datasource-dependencies": {
                      datasource: "DS2",
                      "column-instance": {
                        column: "[C]",
                        derivation: "None",
                        name: "[none:C:nk]",
                        type: "nominal",
                      },
                    },
                  },
                },
              },
            ],
          },
        },
      };

      const result = transformTWBData(mockTWB);
      expect(result.usedFieldIds.has(generateNodeId("DS1", "[A]"))).toBe(true);
      expect(result.usedFieldIds.has(generateNodeId("DS1", "[B]"))).toBe(false);
      expect(result.usedFieldIds.has(generateNodeId("DS2", "[C]"))).toBe(true);
      expect(result.usedFieldIds.has(generateNodeId("DS2", "[D]"))).toBe(false);
    });

    test("handles workbook with no worksheets", () => {
      const mockTWB = {
        workbook: {
          datasources: {
            datasource: {
              name: "TestDS",
              connection: {
                relation: {
                  type: "table" as const,
                  columns: {
                    column: { name: "Field1", datatype: "string" },
                  },
                },
              },
            },
          },
        },
      };

      const result = transformTWBData(mockTWB);
      expect(result.usedFieldIds).toBeInstanceOf(Set);
      expect(result.usedFieldIds.size).toBe(0);
    });

    test("handles worksheet with no datasource-dependencies", () => {
      const mockTWB = {
        workbook: {
          datasources: {
            datasource: {
              name: "TestDS",
              connection: {
                relation: {
                  type: "table" as const,
                  columns: {
                    column: { name: "Field1", datatype: "string" },
                  },
                },
              },
            },
          },
          worksheets: {
            worksheet: {
              name: "EmptySheet",
              table: {
                view: {},
              },
            },
          },
        },
      };

      const result = transformTWBData(mockTWB);
      expect(result.usedFieldIds.size).toBe(0);
    });
  });

  describe("Real TWB files", () => {
    test("Superstore_12thapr_v4.twb has unused fields", () => {
      const fileContent = fs.readFileSync(
        path.join(__dirname, "../../example-files/Superstore_12thapr_v4.twb"),
        "utf-8"
      );
      const parsedFile = parseTWBSync(fileContent);
      const result = transformTWBData(parsedFile);

      const allNodes = Array.from(result.nodesById.values());
      const unusedNodes = allNodes.filter(
        (node) => !result.usedFieldIds.has(node.id)
      );
      const usedNodes = allNodes.filter((node) =>
        result.usedFieldIds.has(node.id)
      );

      // There should be some used and some unused fields
      expect(usedNodes.length).toBeGreaterThan(0);
      expect(unusedNodes.length).toBeGreaterThan(0);
      expect(usedNodes.length + unusedNodes.length).toBe(allNodes.length);
    });

    test("Superstore_12thapr_v4.twb Sales field is used in worksheets", () => {
      const fileContent = fs.readFileSync(
        path.join(__dirname, "../../example-files/Superstore_12thapr_v4.twb"),
        "utf-8"
      );
      const parsedFile = parseTWBSync(fileContent);
      const result = transformTWBData(parsedFile);

      // Sales is used in multiple worksheets — it should be marked as used
      const salesNodes = Array.from(result.nodesById.values()).filter(
        (node) =>
          node.displayName === "Sales" && node.type === "datasource"
      );
      expect(salesNodes.length).toBeGreaterThan(0);
      salesNodes.forEach((node) => {
        expect(result.usedFieldIds.has(node.id)).toBe(true);
      });
    });

    test("all example files produce valid usedFieldIds", () => {
      const exampleFilesDir = path.join(__dirname, "../../example-files");
      const files = fs
        .readdirSync(exampleFilesDir)
        .filter((file) => file.endsWith(".twb"));

      files.forEach((filename) => {
        const fileContent = fs.readFileSync(
          path.join(exampleFilesDir, filename),
          "utf-8"
        );
        const parsedFile = parseTWBSync(fileContent);
        const result = transformTWBData(parsedFile);

        expect(result.usedFieldIds).toBeInstanceOf(Set);

        // Every ID in usedFieldIds should correspond to an actual node
        for (const id of result.usedFieldIds) {
          expect(result.nodesById.has(id)).toBe(true);
        }
      });
    });
  });
});
