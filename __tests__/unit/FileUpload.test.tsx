import { XMLParser } from "fast-xml-parser";
import * as fs from "fs";
import * as path from "path";
import {
  AggregationType,
  CalculationNode,
  ColumnNode,
  DataType,
  Node,
  Role,
  ParameterNode,
} from "../../src/types/app.types";

interface Column {
  "@_name"?: string;
  "@_caption"?: string;
  "@_role"?: string;
  "@_datatype"?: string;
  calculation?: {
    "@_class"?: string;
    "@_formula"?: string;
  };
}

const parser = new XMLParser({
  ignoreAttributes: false,
  htmlEntities: false,
  attributeNamePrefix: "@_",
  preserveOrder: false,
  parseAttributeValue: true,
});

function readTWBFile(filename: string): string {
  const filePath = path.join(process.cwd(), "example-files", filename);
  try {
    return fs.readFileSync(filePath, "utf-8");
  } catch (error) {
    console.error(`Error reading file ${filename}:`, error);
    throw error;
  }
}

const testFiles = [
  "test_book.twb",
  "test.twb",
  "Validation _ S2 2023 Combined Results (2).twb",
];

describe("TWB File Parsing", () => {
  testFiles.forEach((file) => {
    describe(`File: ${file}`, () => {
      const twbContent = readTWBFile(file);
      const parsedXML = parser.parse(twbContent);

      // Log the overall structure
      console.log(`\n=== Structure for ${file} ===`);
      console.log("Top level keys:", Object.keys(parsedXML));
      console.log("Workbook keys:", Object.keys(parsedXML.workbook));
      console.log(
        "Datasources structure:",
        typeof parsedXML.workbook.datasources
      );

      test("parses XML correctly", () => {
        expect(parsedXML).toBeDefined();
        expect(parsedXML.workbook).toBeDefined();
        expect(parsedXML.workbook.datasources).toBeDefined();

        // Log more details about the structure
        console.log("\nDetailed structure:");
        if (parsedXML.workbook.datasources.datasource) {
          const datasources = parsedXML.workbook.datasources.datasource;
          if (Array.isArray(datasources)) {
            console.log(`Number of datasources: ${datasources.length}`);
            datasources.forEach((ds, idx) => {
              console.log(`\nDatasource ${idx}:`);
              console.log("Keys:", Object.keys(ds));
              console.log("Name:", ds["@_name"]);
              if (ds.column) {
                const columns = Array.isArray(ds.column)
                  ? ds.column
                  : [ds.column];
                console.log(`Number of columns: ${columns.length}`);
                console.log(
                  "First column structure:",
                  JSON.stringify(columns[0], null, 2)
                );
              }
            });
          } else {
            console.log("Single datasource structure:");
            console.log("Keys:", Object.keys(datasources));
            console.log("Name:", datasources["@_name"]);
            if (datasources.column) {
              const columns = Array.isArray(datasources.column)
                ? datasources.column
                : [datasources.column];
              console.log(`Number of columns: ${columns.length}`);
              console.log(
                "First column structure:",
                JSON.stringify(columns[0], null, 2)
              );
            }
          }
        }
      });

      test("identifies datasources", () => {
        const datasources = parsedXML.workbook.datasources.datasource;
        expect(datasources).toBeDefined();
        if (Array.isArray(datasources)) {
          datasources.forEach((ds, index) => {
            expect(ds).toBeDefined();
            console.log(`Datasource ${index}: ${ds["@_name"] || "unnamed"}`);
          });
        } else {
          expect(datasources).toBeDefined();
          console.log(
            `Single datasource: ${datasources["@_name"] || "unnamed"}`
          );
        }
      });

      test("identifies columns in each datasource", () => {
        const datasources = parsedXML.workbook.datasources.datasource;
        const dsArray = Array.isArray(datasources)
          ? datasources
          : [datasources];

        dsArray.forEach((ds, dsIndex) => {
          if (ds.column) {
            const columns = Array.isArray(ds.column) ? ds.column : [ds.column];
            columns.forEach((col: Column, colIndex: number) => {
              expect(col).toBeDefined();
              const name = col["@_name"] || col["@_caption"] || "unnamed";
              const type = col.calculation ? "calculation" : "regular";
              console.log(
                `DS ${dsIndex}, Column ${colIndex}: ${name} (${type})`
              );
            });
          }
        });
      });

      test("parses calculation columns correctly", () => {
        const datasources = parsedXML.workbook.datasources.datasource;
        const dsArray = Array.isArray(datasources)
          ? datasources
          : [datasources];

        console.log("\n=== Calculation Fields Analysis ===");
        dsArray.forEach((ds, dsIndex) => {
          console.log(
            `\nAnalyzing datasource ${dsIndex}: ${ds["@_name"] || "unnamed"}`
          );

          if (ds.column) {
            const columns = Array.isArray(ds.column) ? ds.column : [ds.column];
            console.log(`Total columns in datasource: ${columns.length}`);

            const calcColumns = columns.filter(
              (col: Column) => col.calculation
            );
            console.log(`Number of calculation columns: ${calcColumns.length}`);

            if (calcColumns.length > 0) {
              console.log("\nFirst calculation column full structure:");
              console.log(JSON.stringify(calcColumns[0], null, 2));
            }

            calcColumns.forEach((col: Column) => {
              expect(col.calculation).toBeDefined();
              if (col.calculation?.["@_formula"]) {
                const formula = col.calculation["@_formula"];
                console.log("\nAnalyzing calculation:");
                console.log("Caption:", col["@_caption"]);
                console.log("Formula type:", typeof formula);
                console.log("Formula value:", formula);

                if (typeof formula === "string") {
                  const fieldRefs = formula.match(/\[([^\]]+)\]/g) || [];
                  console.log(
                    `Found calculation: ${col["@_caption"] || "unnamed"}`
                  );
                  console.log(`Formula: ${formula}`);
                  console.log(
                    `Referenced fields: ${fieldRefs
                      .map((ref: string) => ref.slice(1, -1))
                      .join(", ")}`
                  );
                } else {
                  console.log(
                    `Found calculation with non-string formula: ${
                      col["@_caption"] || "unnamed"
                    }`
                  );
                  console.log(`Formula type: ${typeof formula}`);
                  console.log(`Formula value:`, formula);
                }
              } else {
                console.log("\nCalculation without formula:");
                console.log(JSON.stringify(col, null, 2));
              }
            });
          } else {
            console.log("No columns found in datasource");
          }
        });
      });
    });
  });
});

// Test the actual parsing functions
describe("Node Parsing", () => {
  const getFieldType = (
    column: any
  ): "column" | "calculation" | "parameter" => {
    if (column?.["@_param-domain-type"]) {
      return "parameter";
    }
    if (column?.calculation) {
      return "calculation";
    }
    return "column";
  };

  const generateId = (prefix: string, index: number): string => {
    return `field-${index}`;
  };

  const parseDataType = (type: string): DataType | undefined => {
    switch (type?.toLowerCase()) {
      case "string":
      case "wstr":
        return "string";
      case "integer":
      case "i8":
        return "integer";
      case "real":
      case "r8":
        return "real";
      case "date":
        return "date";
      case "boolean":
        return "boolean";
      default:
        return undefined;
    }
  };

  const parseAggregation = (agg: string): AggregationType => {
    switch (agg?.toLowerCase()) {
      case "sum":
        return "Sum";
      case "count":
        return "Count";
      case "year":
        return "Year";
      default:
        return "None";
    }
  };

  const parseColumn = (column: Record<string, any>, index: number): Node => {
    const id = generateId("field", index);
    const type = getFieldType(column);
    const name = column["@_name"] || "";
    const caption = column["@_caption"];
    const displayName = caption || name.replace(/[\[\]]/g, "");

    const baseNode = {
      id,
      name,
      type,
      caption,
      dataType: parseDataType(column["@_datatype"]),
      role: column["@_role"] as Role,
      displayName,
    };

    if (type === "parameter") {
      const parameterNode: ParameterNode = {
        ...baseNode,
        type: "parameter",
        paramDomainType: column["@_param-domain-type"] as "list" | "range",
        members: column.members?.member?.map((m: any) => ({
          value: m.value,
          alias: m.alias,
        })),
      };
      return parameterNode;
    } else if (type === "column") {
      const columnNode: ColumnNode = {
        ...baseNode,
        type: "column",
        aggregation: column["@_aggregation"] || undefined,
        defaultFormat: column["@_default-format"],
        precision: column["@_precision"]
          ? parseInt(column["@_precision"], 10)
          : undefined,
        containsNull: column["@_contains-null"] === "true" ? true : undefined,
        ordinal: column["@_ordinal"]
          ? parseInt(column["@_ordinal"], 10)
          : undefined,
        remoteAlias: column["@_remote-alias"],
        remoteName: column["@_remote-name"],
        remoteType: column["@_remote-type"],
      };
      return columnNode;
    } else {
      const calculationNode: CalculationNode = {
        ...baseNode,
        type: "calculation",
        calculation: column.calculation?.["@_formula"],
        class: column.calculation?.["@_class"] as "tableau" | undefined,
      };
      return calculationNode;
    }
  };

  describe("Required Fields Validation", () => {
    test("regular column has all required fields", () => {
      const sampleColumn = {
        "@_name": "Sales",
        "@_caption": "Total Sales",
        "@_role": "measure",
        "@_datatype": "real",
        "@_aggregation": "sum",
        "@_default-format": "#,##0",
        "@_precision": "2",
        "@_contains-null": "true",
        "@_ordinal": "1",
        "@_remote-alias": "Sales",
        "@_remote-name": "Sales",
        "@_remote-type": "real",
      };

      const result = parseColumn(sampleColumn, 0);
      expect(result.type).toBe("column");

      if (result.type === "column") {
        // Test presence of all required fields
        expect(result).toHaveProperty("id");
        expect(result).toHaveProperty("name");
        expect(result).toHaveProperty("type");
        expect(result).toHaveProperty("caption");
        expect(result).toHaveProperty("dataType");
        expect(result).toHaveProperty("role");

        // Test specific field values
        expect(result.id).toBe("field-0");
        expect(result.name).toBe("Sales");
        expect(result.type).toBe("column");
        expect(result.caption).toBe("Total Sales");
        expect(result.dataType).toBe("real");
        expect(result.role).toBe("measure");

        // Test column-specific fields
        expect(result).toHaveProperty("aggregation");
        expect(result).toHaveProperty("defaultFormat");
        expect(result).toHaveProperty("precision");
        expect(result).toHaveProperty("containsNull");
        expect(result).toHaveProperty("ordinal");
        expect(result).toHaveProperty("remoteAlias");
        expect(result).toHaveProperty("remoteName");
        expect(result).toHaveProperty("remoteType");

        // Test that calculation-specific fields are not present
        expect(result).not.toHaveProperty("class");
        expect(result).not.toHaveProperty("paramDomainType");
      }
    });

    test("calculation has all required fields", () => {
      const sampleCalcColumn = {
        "@_caption": "Profit Ratio",
        "@_name": "Calculation_123",
        "@_role": "measure",
        "@_datatype": "real",
        calculation: {
          "@_class": "tableau",
          "@_formula": "[Profit]/[Sales]",
        },
      };

      const result = parseColumn(sampleCalcColumn, 0);
      expect(result.type).toBe("calculation");

      if (result.type === "calculation") {
        // Test presence of all required fields
        expect(result).toHaveProperty("id");
        expect(result).toHaveProperty("name");
        expect(result).toHaveProperty("type");
        expect(result).toHaveProperty("caption");
        expect(result).toHaveProperty("dataType");
        expect(result).toHaveProperty("role");
        expect(result).toHaveProperty("calculation");

        // Test specific field values
        expect(result.id).toBe("field-0");
        expect(result.name).toBe("Calculation_123");
        expect(result.type).toBe("calculation");
        expect(result.caption).toBe("Profit Ratio");
        expect(result.dataType).toBe("real");
        expect(result.role).toBe("measure");
        expect(result.calculation).toBe("[Profit]/[Sales]");

        // Test calculation-specific fields
        expect(result).toHaveProperty("class");
        expect(result.class).toBe("tableau");

        // Test that column-specific fields are not present
        expect(result).not.toHaveProperty("aggregation");
        expect(result).not.toHaveProperty("defaultFormat");
        expect(result).not.toHaveProperty("precision");
        expect(result).not.toHaveProperty("containsNull");
        expect(result).not.toHaveProperty("ordinal");
        expect(result).not.toHaveProperty("remoteAlias");
        expect(result).not.toHaveProperty("remoteName");
        expect(result).not.toHaveProperty("remoteType");
      }
    });

    test("parameter has all required fields", () => {
      const sampleParamColumn = {
        "@_caption": "Year Parameter",
        "@_name": "Parameter_123",
        "@_role": "measure",
        "@_datatype": "integer",
        "@_param-domain-type": "range",
        members: {
          member: [
            { value: "2021", alias: "2021" },
            { value: "2022", alias: "2022" },
            { value: "2023", alias: "2023" },
          ],
        },
      };

      const result = parseColumn(sampleParamColumn, 0);
      expect(result.type).toBe("parameter");

      if (result.type === "parameter") {
        // Test presence of all required fields
        expect(result).toHaveProperty("id");
        expect(result).toHaveProperty("name");
        expect(result).toHaveProperty("type");
        expect(result).toHaveProperty("caption");
        expect(result).toHaveProperty("dataType");
        expect(result).toHaveProperty("role");
        expect(result).toHaveProperty("paramDomainType");
        expect(result).toHaveProperty("members");

        // Test specific field values
        expect(result.id).toBe("field-0");
        expect(result.name).toBe("Parameter_123");
        expect(result.type).toBe("parameter");
        expect(result.caption).toBe("Year Parameter");
        expect(result.dataType).toBe("integer");
        expect(result.role).toBe("measure");
        expect(result.paramDomainType).toBe("range");
        expect(result.members).toEqual([
          { value: "2021", alias: "2021" },
          { value: "2022", alias: "2022" },
          { value: "2023", alias: "2023" },
        ]);

        // Test that calculation-specific fields are not present
        expect(result).not.toHaveProperty("formula");
        expect(result).not.toHaveProperty("calculation");
        expect(result).not.toHaveProperty("class");

        // Test that column-specific fields are not present
        expect(result).not.toHaveProperty("aggregation");
        expect(result).not.toHaveProperty("defaultFormat");
        expect(result).not.toHaveProperty("precision");
        expect(result).not.toHaveProperty("containsNull");
        expect(result).not.toHaveProperty("ordinal");
        expect(result).not.toHaveProperty("remoteAlias");
        expect(result).not.toHaveProperty("remoteName");
        expect(result).not.toHaveProperty("remoteType");
      }
    });
  });

  test("parses regular column correctly", () => {
    const sampleColumn = {
      "@_caption": "Sales",
      "@_datatype": "integer",
      "@_name": "[Sales]",
      "@_role": "measure",
    };

    const result = parseColumn(sampleColumn, 1);
    expect(result).toEqual({
      id: "field-1",
      name: "[Sales]",
      type: "column",
      caption: "Sales",
      dataType: "integer",
      role: "measure",
      aggregation: undefined,
      defaultFormat: undefined,
      precision: undefined,
      containsNull: undefined,
      ordinal: undefined,
      remoteAlias: undefined,
      displayName: "Sales",
    });
  });

  test("parses parameter correctly", () => {
    const sampleParam = {
      "@_caption": "Date Range",
      "@_datatype": "date",
      "@_name": "[Parameter 1]",
      "@_role": "measure",
      "@_param-domain-type": "list",
      members: {
        member: [
          { value: "2021", alias: "2021" },
          { value: "2022", alias: "2022" },
          { value: "2023", alias: "2023" },
        ],
      },
    };

    const result = parseColumn(sampleParam, 1);
    expect(result).toEqual({
      id: "field-1",
      name: "[Parameter 1]",
      type: "parameter",
      caption: "Date Range",
      dataType: "date",
      role: "measure",
      paramDomainType: "list",
      displayName: "Date Range",
      members: [
        { value: "2021", alias: "2021" },
        { value: "2022", alias: "2022" },
        { value: "2023", alias: "2023" },
      ],
    });
  });

  test("parses calculation column correctly", () => {
    const sampleCalcColumn = {
      "@_caption": "Sales vs Target",
      calculation: {
        "@_class": "tableau",
        "@_formula": "SUM([Sales]) / SUM([Target])",
      },
    };

    const result = parseColumn(sampleCalcColumn, 1);
    expect(result).toEqual({
      id: "field-1",
      name: "",
      type: "calculation",
      caption: "Sales vs Target",
      dataType: undefined,
      role: undefined,
      calculation: "SUM([Sales]) / SUM([Target])",
      class: "tableau",
      displayName: "Sales vs Target",
    });
  });
});

// Test reference creation
describe("Reference Creation", () => {
  test("creates direct references correctly", () => {
    const nodes = [
      { id: "field-0", name: "Sales", type: "column" },
      { id: "field-1", name: "Target", type: "column" },
      {
        id: "field-2",
        name: "Sales vs Target",
        type: "calculation",
        calculation: "SUM([Sales]) / SUM([Target])",
      },
    ];

    const references: Array<{
      sourceId: string;
      targetId: string;
      type: string;
    }> = [];
    const calculations = nodes.filter((node) => node.type === "calculation");

    calculations.forEach((calc) => {
      if (calc.calculation) {
        const matches = calc.calculation.match(/\[([^\]]+)\]/g) || [];
        matches.forEach((match) => {
          const fieldName = match.slice(1, -1);
          const targetNode = nodes.find((n) => n.name === fieldName);
          if (targetNode) {
            references.push({
              sourceId: calc.id,
              targetId: targetNode.id,
              type: "direct",
            });
          }
        });
      }
    });

    expect(references).toHaveLength(2);
    expect(references).toContainEqual({
      sourceId: "field-2",
      targetId: "field-0",
      type: "direct",
    });
    expect(references).toContainEqual({
      sourceId: "field-2",
      targetId: "field-1",
      type: "direct",
    });
  });
});
