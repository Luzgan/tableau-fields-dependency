import { TWBFile, getDefaultRoleForDatatype } from "../types/twb.types";
import {
  FileData,
  Node,
  DatasourceNode,
  CalculationNode,
  ParameterNode,
  Reference,
} from "../types/app.types";
import { ColumnDataType, ColumnRole } from "../types/enums";
import { ensureArray } from "./twbParser";

/**
 * Converts string datatype to ColumnDataType enum
 */
function convertDataType(datatype: string): ColumnDataType {
  switch (datatype.toLowerCase()) {
    case "string":
      return ColumnDataType.String;
    case "integer":
      return ColumnDataType.Integer;
    case "real":
      return ColumnDataType.Real;
    case "boolean":
      return ColumnDataType.Boolean;
    case "date":
      return ColumnDataType.Date;
    case "datetime":
      return ColumnDataType.DateTime;
    case "spatial":
      return ColumnDataType.Spatial;
    case "table":
      return ColumnDataType.Table;
    default:
      return ColumnDataType.String;
  }
}

/**
 * Converts string role to ColumnRole enum
 */
function convertRole(role: string): ColumnRole {
  switch (role.toLowerCase()) {
    case "measure":
      return ColumnRole.Measure;
    case "dimension":
      return ColumnRole.Dimension;
    default:
      return ColumnRole.Dimension;
  }
}

/**
 * Generates a unique ID for a node
 */
export function generateNodeId(
  datasourceName: string,
  columnName: string
): string {
  // Clean up datasource name
  const safeDatasourceName = datasourceName
    .replace(/[\s\/\{\}\(\)]+/g, "-")
    .replace(/[^a-zA-Z0-9\-_]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  // Clean up column name - remove brackets and make URL-safe
  const safeColumnName = columnName
    .replace(/[\[\]]/g, "")
    .replace(/[\s\/\{\}\(\)]+/g, "-")
    .replace(/[^a-zA-Z0-9\-_]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return `${safeDatasourceName}--${safeColumnName}`;
}

/**
 * Parses a reference string into its components
 * Examples:
 * - "[Datasource].[Field]" -> { datasource: "Datasource", field: "Field" }
 * - "[Field]" -> { field: "Field" }
 */
function parseReference(ref: string): { datasource?: string; field: string } {
  const match = ref.match(/^\[([^\]]+)\]\.\[([^\]]+)\]$|^\[([^\]]+)\]$/);
  if (!match) {
    throw new Error(`Invalid reference format: ${ref}`);
  }

  if (match[1] && match[2]) {
    // Datasource-qualified reference [Datasource].[Field]
    return {
      datasource: match[1],
      field: match[2],
    };
  } else if (match[3]) {
    // Simple reference [Field]
    return {
      field: match[3],
    };
  }

  throw new Error(`Invalid reference format: ${ref}`);
}

/**
 * Extracts field references from a calculation formula
 */
export function extractReferences(
  formula: string
): { datasource?: string; field: string; matchedText: string }[] {
  const refs = [];

  // First remove all comments (both single-line and multiline)
  const withoutComments = formula
    .replace(/\/\*[\s\S]*?\*\//g, "") // Remove multiline comments /* ... */
    .split("\n")
    .filter((line) => !line.trim().startsWith("//"))
    .join("\n");

  // Then remove all quoted strings (both single and double quotes)
  const withoutQuotes = withoutComments
    .replace(/"[^"\\]*(\\.[^"\\]*)*"/gs, "") // Remove double quoted strings, including multiline
    .replace(/'[^'\\]*(\\.[^'\\]*)*'/gs, ""); // Remove single quoted strings, including multiline

  // Now parse the cleaned text for field references
  const fieldPattern = /\[[^\]]+\]\.\[[^\]]+\]|\[[^\]]+\]/g;
  let match;

  while ((match = fieldPattern.exec(withoutQuotes)) !== null) {
    const refComponents = parseReference(match[0]);
    refs.push({
      ...refComponents,
      matchedText: match[0],
    });
  }

  return refs;
}

/**
 * Finds a relation by name in the datasource, recursively searching through nested relations
 */
function findRelationByName(
  relations: any[],
  relationName: string
): any | undefined {
  for (const relation of relations) {
    // Check if this is the relation we're looking for
    if (relation.name === relationName) {
      return relation;
    }

    // If this relation has nested relations, search through them
    if (relation.relation) {
      const nestedRelations = ensureArray(relation.relation);
      const found = findRelationByName(nestedRelations, relationName);
      if (found) {
        return found;
      }
    }
  }
  return undefined;
}

/**
 * Helper function to find a node in the nodesById map
 */
function findNode(
  nodesById: Map<string, Node>,
  predicate: (node: Node) => boolean
): Node | undefined {
  for (const node of nodesById.values()) {
    if (predicate(node)) {
      return node;
    }
  }
  return undefined;
}

/**
 * Finds a node by its reference (either simple [Field] or datasource-qualified [Datasource].[Field])
 */
export function findNodeByReference(
  nodesById: Map<string, Node>,
  ref: Reference
): Node | undefined {
  if (ref.targetDatasourceName) {
    // Datasource-qualified reference
    return findNode(
      nodesById,
      (node) =>
        node.datasourceName === `${ref.targetDatasourceName}` &&
        (node.name === `[${ref.targetName}]` ||
          node.displayName === `${ref.targetName}`)
    );
  } else {
    // Simple reference
    return findNode(
      nodesById,
      (node) =>
        node.name === `[${ref.targetName}]` ||
        node.caption === `${ref.targetName}`
    );
  }
}

/**
 * Transforms TWB file into our internal types
 */
export function transformTWBData(twbFile: TWBFile): FileData {
  const nodesById = new Map<string, Node>();
  const references: Reference[] = [];

  // Get datasources from the workbook
  const datasources = ensureArray(twbFile.workbook.datasources.datasource);

  // First pass: Create all nodes
  datasources.forEach((ds) => {
    // Skip datasources with pivot relations
    const relations = ensureArray(ds.connection?.relation);
    if (relations.some((r) => r.type === "pivot")) {
      return;
    }

    // Get column mappings if they exist
    const columnMappings = ds.connection?.cols?.map
      ? ensureArray(ds.connection.cols.map)
      : [];

    if (columnMappings.length > 0) {
      // Process columns from relations based on mappings
      columnMappings.forEach((mapping) => {
        const ref = parseReference(mapping.value);
        const relationName = ref.datasource ?? "";
        const fieldName = ref.field;

        console.log(`Processing mapping: ${mapping.key} -> ${mapping.value}`);
        console.log(
          `Looking for relation: ${relationName} and field: ${fieldName}`
        );

        const relation = findRelationByName(relations, relationName);
        if (!relation) {
          console.log(`Relation not found: ${relationName}`);
          return;
        }
        if (!relation.columns) {
          console.log(`No columns in relation: ${relationName}`);
          return;
        }

        const columns = ensureArray(relation.columns.column);
        const column = columns.find((col) => col.name === fieldName);
        if (!column) {
          console.log(
            `Column not found: ${fieldName} in relation ${relationName}`
          );
          return;
        }

        const id = generateNodeId(ds.name, mapping.key);
        const name = mapping.key;
        const dataType = convertDataType(column.datatype);
        const role = convertRole(getDefaultRoleForDatatype(column.datatype));

        // Create data source field node
        const fieldNode: DatasourceNode = {
          id,
          name,
          type: "datasource",
          dataType,
          role,
          displayName: mapping.key.replace(/[\[\]]/g, ""),
          datasourceName: ds.name,
        };
        nodesById.set(id, fieldNode);
        console.log(`Created node for ${mapping.key}`);
      });
    } else {
      // Process columns directly from relations
      relations.forEach((relation) => {
        if (!relation.columns) return;

        const columns = ensureArray(relation.columns.column);
        columns.forEach((col) => {
          const id = generateNodeId(ds.name, col.name);
          const name = `[${col.name}]`;
          const dataType = convertDataType(col.datatype);
          const role = convertRole(getDefaultRoleForDatatype(col.datatype));

          // Create data source field node
          const fieldNode: DatasourceNode = {
            id,
            name,
            type: "datasource",
            dataType,
            role,
            displayName: col.name,
            datasourceName: ds.name,
          };
          nodesById.set(id, fieldNode);
        });
      });
    }

    // Process metadata records
    const metadataRecords = ds.connection?.["metadata-records"]?.[
      "metadata-record"
    ]
      ? ensureArray(ds.connection["metadata-records"]["metadata-record"])
      : [];

    metadataRecords.forEach((record) => {
      if (record["class"] !== "column") return;

      const id = generateNodeId(ds.name, record["local-name"]);
      const name = record["local-name"];
      const dataType = convertDataType(record["local-type"]);
      const role = convertRole(getDefaultRoleForDatatype(record["local-type"]));

      // Create or update data source field node
      const existingNode = nodesById.get(id);
      if (existingNode) {
        // Update existing node with metadata
        existingNode.dataType = dataType;
        existingNode.role = role;
      } else {
        // Create new node from metadata
        const fieldNode: DatasourceNode = {
          id,
          name,
          type: "datasource",
          dataType,
          role,
          displayName: name.replace(/[\[\]]/g, ""),
          datasourceName: ds.name,
        };
        nodesById.set(id, fieldNode);
      }
    });

    // Process direct columns for calculations, parameters, and overwrites
    const directColumns = ds.column ? ensureArray(ds.column) : [];
    directColumns.forEach((col) => {
      const id = generateNodeId(ds.name, col.name);
      const name = col.name;
      const caption = col.caption;
      const displayName = caption || name.replace(/[\[\]]/g, "");
      const dataType = convertDataType(col.datatype);
      const role = convertRole(col.role);

      if ("calculation" in col) {
        // Create calculation node
        const calcNode: CalculationNode = {
          id,
          name,
          type: "calculation",
          caption,
          dataType,
          role,
          displayName,
          calculation: col.calculation.formula,
          datasourceName: ds.name,
        };
        nodesById.set(id, calcNode);

        // Extract references from calculation
        const fieldRefs = extractReferences(calcNode.calculation);
        fieldRefs.forEach(({ datasource, field, matchedText }) => {
          const reference: Reference = {
            sourceId: id,
            type: "direct",
            matchedText,
            targetDatasourceName: datasource,
            targetName: field,
          };
          references.push(reference);
        });
      } else if (ds.name === "Parameters") {
        // Create parameter node
        const paramNode: ParameterNode = {
          id,
          name,
          type: "parameter",
          caption,
          dataType,
          role,
          displayName,
          datasourceName: ds.name,
        };
        nodesById.set(id, paramNode);
      } else {
        // Check if this is an overwrite for a relation column
        const existingNode = nodesById.get(id);
        if (existingNode && existingNode.type === "datasource") {
          // Update the existing node with overwrite information
          existingNode.caption = caption;
          existingNode.displayName = displayName;
          existingNode.role = role;
          existingNode.dataType = dataType;
        } else {
          nodesById.set(id, {
            id,
            name,
            caption,
            type: "datasource",
            dataType,
            role,
            displayName,
            datasourceName: ds.name,
          });
        }
      }
    });
  });

  return {
    nodesById,
    references,
  };
}
