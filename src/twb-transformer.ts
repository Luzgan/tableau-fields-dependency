import {
  TWBDatasource,
  TWBCalculationColumn,
  TWBRegularColumn,
  isCalculationColumn,
  isParameterColumn,
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
  ParameterNode,
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
function mapRole(twbRole: string | undefined): Role {
  if (!twbRole) {
    throw new Error("Role is required but was not provided");
  }
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
 * Decodes HTML entities in a string
 */
function decodeHtmlEntities(text: string): string {
  if (!text) return text;

  // First, handle combined entities like &#13;&#10;
  text = text.replace(/&#13;&#10;/g, "\r\n");

  // Then handle individual numeric entities
  text = text.replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec));

  // Finally handle named entities
  const entities: { [key: string]: string } = {
    "&lt;": "<",
    "&gt;": ">",
    "&amp;": "&",
    "&quot;": '"',
    "&apos;": "'",
  };

  return text.replace(/&[a-z]+;/g, (match) => entities[match] || match);
}

/**
 * Cleans a calculation formula by removing comments
 */
function cleanCalculation(formula: string): string {
  if (!formula) return formula;

  // Remove single-line comments
  const commentRegex = /\/\/.*?[\r\n]/gm;
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
      const name = col["@_name"] || "";
      const caption = col["@_caption"];
      const displayName = caption || name.replace(/[\[\]]/g, "");
      const role = mapRole(col["@_role"]); // Will throw if role is missing

      if (isParameterColumn(col)) {
        // Create parameter node
        const paramNode: ParameterNode = {
          id,
          name,
          displayName,
          type: "parameter",
          caption,
          dataType: mapDataType(col["@_datatype"]),
          role,
          paramDomainType: col["@_param-domain-type"],
          members: col.members?.member?.map((m: any) => ({
            value: m.value,
            alias: m.alias,
          })),
        };
        nodesById.set(id, paramNode);
      } else if (isCalculationColumn(col)) {
        // Create calculation node
        const calculation = decodeHtmlEntities(col.calculation?.["@_formula"]);
        const calcNode: CalculationNode = {
          id,
          name,
          displayName,
          type: "calculation",
          caption,
          dataType: mapDataType(col["@_datatype"]),
          role,
          calculation,
          class: col.calculation?.["@_class"] as "tableau" | undefined,
        };
        nodesById.set(id, calcNode);

        // Extract references from calculation
        if (calcNode.calculation) {
          const fieldRefs = extractReferences(calcNode.calculation);
          fieldRefs.forEach((fieldName) => {
            referencedFields.add(fieldName);
            const ref: Reference = {
              sourceId: id,
              targetId: fieldName,
              type: "direct",
            };
            references.push(ref);
          });
        }
      } else {
        // Create column node
        const colNode: ColumnNode = {
          id,
          name,
          displayName,
          type: "column",
          caption,
          dataType: mapDataType(col["@_datatype"]),
          role,
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
