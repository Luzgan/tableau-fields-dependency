import {
  TWBDatasource,
  TWBCalculationColumn,
  TWBRegularColumn,
  isCalculationColumn,
} from "./twb-types";
import {
  Node,
  ColumnNode,
  CalculationNode,
  Reference,
  FileData,
  DataType,
  Role,
  AggregationType,
} from "./types";

/**
 * Maps TWB data types to our internal DataType
 */
function mapDataType(twbType: string): DataType {
  switch (twbType.toLowerCase()) {
    case "string":
      return "string";
    case "integer":
      return "integer";
    case "real":
      return "real";
    case "date":
      return "date";
    case "boolean":
      return "boolean";
    default:
      return "string"; // Default to string for unknown types
  }
}

/**
 * Maps TWB roles to our internal Role
 */
function mapRole(twbRole: string): Role {
  return twbRole.toLowerCase() === "measure" ? "measure" : "dimension";
}

/**
 * Maps TWB aggregation to our internal AggregationType
 */
function mapAggregation(twbAggregation: string): AggregationType {
  switch (twbAggregation) {
    case "Sum":
      return "Sum";
    case "Count":
      return "Count";
    case "Year":
      return "Year";
    default:
      return "None";
  }
}

/**
 * Cleans a calculation formula by removing comments
 */
function cleanCalculation(formula: string): string {
  if (!formula) return formula;

  // Remove single-line comments that end with &#13;&#10; (XML encoded newline)
  const commentRegex = /\/\/.*?&#13;&#10;/gm;
  return formula.replace(commentRegex, "");
}

/**
 * Extracts field references from a calculation formula
 */
function extractReferences(formula: string): string[] {
  // Clean the formula first
  const cleanedFormula = cleanCalculation(formula);

  // Match field references like [Field Name] or [Field.Name]
  const fieldPattern = /\[([\w\s\._-]+)\]/g;
  const matches = cleanedFormula.match(fieldPattern) || [];

  // Clean up the matches to remove brackets and deduplicate
  const uniqueRefs = new Set(matches.map((match) => match.slice(1, -1)));
  return Array.from(uniqueRefs);
}

/**
 * Generates a unique ID for a node
 */
function generateNodeId(datasourceName: string, columnName: string): string {
  return `${datasourceName}::${columnName}`;
}

/**
 * Checks if a field name is referenced in a formula
 */
function isFieldReferenced(fieldName: string, formula: string): boolean {
  // Clean the formula first
  const cleanedFormula = cleanCalculation(formula);

  // Escape special characters in the field name and create a pattern that matches the field in brackets
  const escapedName = fieldName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`\\[${escapedName}\\]`);

  return pattern.test(cleanedFormula);
}

/**
 * Transforms TWB datasources into our internal types
 */
export function transformTWBData(
  datasources: TWBDatasource[],
  filename: string
): FileData {
  const nodesById = new Map<string, Node>();
  const references: Reference[] = [];
  const referencedFields = new Set<string>();

  // First pass: Create all nodes
  datasources.forEach((ds) => {
    const columns = Array.isArray(ds.column)
      ? ds.column
      : ds.column
      ? [ds.column]
      : [];

    columns.forEach((col) => {
      const id = generateNodeId(ds["@_name"], col["@_name"]);

      if (isCalculationColumn(col)) {
        // Create calculation node
        const calcNode: CalculationNode = {
          id,
          name: col["@_name"],
          type: "calculation",
          caption: col["@_caption"],
          dataType: mapDataType(col["@_datatype"]),
          role: mapRole(col["@_role"]),
          formula: col.calculation?.["@_formula"],
          calculation: col.calculation?.["@_formula"],
          paramDomainType: col["@_param-domain-type"],
          class: col.calculation?.["@_class"] as "tableau" | undefined,
        };
        nodesById.set(id, calcNode);

        // Extract references from formula
        if (calcNode.formula) {
          const fieldRefs = extractReferences(calcNode.formula);
          fieldRefs.forEach((fieldName) => {
            referencedFields.add(fieldName);
            const ref: Reference = {
              sourceId: id,
              targetId: fieldName, // This will be updated in the second pass
              type: "direct",
            };
            references.push(ref);
          });
        }
      } else {
        // Create column node
        const colNode: ColumnNode = {
          id,
          name: col["@_name"],
          type: "column",
          caption: col["@_caption"],
          dataType: mapDataType(col["@_datatype"]),
          role: mapRole(col["@_role"]),
          aggregation: mapAggregation(col["@_aggregation"]),
          defaultFormat: col["@_default-format"],
          precision: col["@_precision"]
            ? parseInt(col["@_precision"], 10)
            : undefined,
          containsNull: col["@_contains-null"] === "true",
          ordinal: col["@_ordinal"]
            ? parseInt(col["@_ordinal"], 10)
            : undefined,
          remoteAlias: col["@_remote-alias"],
          remoteName: col["@_remote-name"],
          remoteType: col["@_remote-type"],
        };
        nodesById.set(id, colNode);
      }
    });
  });

  // Second pass: Update reference target IDs
  const updatedReferences: Reference[] = references.map((ref) => {
    // Try to find the actual node ID for the referenced field by exact match
    const targetNode = Array.from(nodesById.values()).find((node) => {
      // Try exact match first
      if (node.name === ref.targetId) return true;

      // If no exact match, try matching the field reference pattern
      if (node.name.includes("[") && node.name.includes("]")) {
        const cleanName = node.name.slice(1, -1); // Remove brackets
        return cleanName === ref.targetId;
      }

      // If the node name doesn't have brackets, add them for comparison
      return `[${node.name}]` === `[${ref.targetId}]`;
    });

    const newRef: Reference = {
      sourceId: ref.sourceId,
      targetId: targetNode?.id || ref.targetId,
      // Mark as indirect if we couldn't find the exact node
      type: targetNode ? "direct" : "indirect",
    };
    return newRef;
  });

  return {
    filename,
    nodesById,
    references: updatedReferences,
  };
}
