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
function extractReferences(
  formula: string
): { ref: string; matchedText: string }[] {
  // Clean the formula first
  const cleanedFormula = cleanCalculation(formula);

  // Match field references like [Field Name] or [Datasource].[Field Name]
  const fieldPattern = /\[([^\]]+)\]|\[([^\]]+)\]\.\[([^\]]+)\]/g;
  const refs = new Map<string, string>();

  // Store unique references with their full matched text (including brackets)
  for (const match of cleanedFormula.matchAll(fieldPattern)) {
    if (match[1]) {
      // Simple field reference [Field Name]
      refs.set(match[1], match[0]);
    } else if (match[2] && match[3]) {
      // Datasource-qualified field reference [Datasource].[Field Name]
      refs.set(`${match[2]}.${match[3]}`, match[0]);
    }
  }

  return Array.from(refs.entries()).map(([ref, matchedText]) => ({
    ref,
    matchedText,
  }));
}

/**
 * Generates a unique ID for a node by making datasourceName--columnName URL-safe
 */
function generateNodeId(datasourceName: string, columnName: string): string {
  // Clean up datasource name
  const safeDatasourceName = datasourceName
    .replace(/[\s\/\{\}\(\)]+/g, "-") // Replace spaces and brackets with dashes
    .replace(/[^a-zA-Z0-9\-_]/g, "") // Remove any other special characters (including colons)
    .replace(/-+/g, "-") // Replace multiple dashes with single dash
    .replace(/^-|-$/g, ""); // Remove leading/trailing dashes

  // Clean up column name - remove brackets and make URL-safe
  const safeColumnName = columnName
    .replace(/[\[\]]/g, "") // Remove square brackets
    .replace(/[\s\/\{\}\(\)]+/g, "-") // Replace spaces and other brackets with dashes
    .replace(/[^a-zA-Z0-9\-_]/g, "") // Remove any other special characters (including colons)
    .replace(/-+/g, "-") // Replace multiple dashes with single dash
    .replace(/^-|-$/g, ""); // Remove leading/trailing dashes

  return `${safeDatasourceName}--${safeColumnName}`;
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
          fieldRefs.forEach(({ ref, matchedText }) => {
            referencedFields.add(ref);
            // Check if the reference contains a datasource name
            const [dsName, fieldName] = ref.split(".");
            const targetId = fieldName
              ? generateNodeId(dsName, fieldName) // Datasource-qualified reference
              : generateNodeId(ds["@_name"], ref); // Simple reference in same datasource
            const reference: Reference = {
              sourceId: id,
              targetId,
              type: "direct",
              matchedText,
            };
            references.push(reference);
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
    // Try to find the actual node ID for the referenced field
    const targetNode = Array.from(nodesById.values()).find((node) => {
      // Match against node's internal name (which already has brackets)
      if (node.name === ref.matchedText) {
        return true;
      }

      // Match against node's caption with brackets added
      if (node.caption && `[${node.caption}]` === ref.matchedText) {
        return true;
      }

      // Handle datasource-qualified references
      const [dsName, fieldName] = ref.matchedText.split(".");
      if (dsName && fieldName) {
        return (
          node.name === fieldName &&
          node.id.startsWith(dsName.replace(/[\[\]]/g, ""))
        );
      }

      return false;
    });

    return {
      sourceId: ref.sourceId,
      targetId: targetNode?.id || ref.targetId,
      type: targetNode ? "direct" : "indirect",
      matchedText: ref.matchedText,
    };
  });

  return {
    filename,
    nodesById,
    references: updatedReferences,
  };
}
