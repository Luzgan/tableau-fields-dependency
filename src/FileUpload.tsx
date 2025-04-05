import { Upload } from "@mui/icons-material";
import { Box, Button, Typography } from "@mui/material";
import React, { useRef } from "react";
import { useAppContext } from "./AppContext";
import {
  AggregationType,
  DataType,
  FileData,
  Node,
  Reference,
  Role,
} from "./types";

const FileUpload: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { fileData, setFileData } = useAppContext();

  const parseDataType = (type: string): DataType | undefined => {
    switch (type.toLowerCase()) {
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
    switch (agg.toLowerCase()) {
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

  const onFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(text, "text/xml");

      const nodes: Node[] = [];
      const references: Reference[] = [];

      // Parse columns
      const columns = xmlDoc.querySelectorAll("column");
      columns.forEach((column: Element) => {
        const node: Node = {
          id: column.getAttribute("name") || "",
          name:
            column.getAttribute("caption") || column.getAttribute("name") || "",
          type: "column",
          caption: column.getAttribute("caption") || undefined,
          dataType: parseDataType(column.getAttribute("datatype") || ""),
          role: (column.getAttribute("role") as Role) || undefined,
          aggregation: parseAggregation(
            column.getAttribute("aggregation") || ""
          ),
          defaultFormat: column.getAttribute("default-format") || undefined,
          precision: column.getAttribute("precision")
            ? parseInt(column.getAttribute("precision") || "0", 10)
            : undefined,
          containsNull: column.getAttribute("contains-null") === "true",
          ordinal: column.getAttribute("ordinal")
            ? parseInt(column.getAttribute("ordinal") || "0", 10)
            : undefined,
          remoteAlias: column.getAttribute("remote-alias") || undefined,
          remoteName: column.getAttribute("remote-name") || undefined,
          remoteType: column.getAttribute("remote-type") || undefined,
        };
        nodes.push(node);
      });

      // Parse calculations
      const calculations = xmlDoc.querySelectorAll("calculation");
      calculations.forEach((calc: Element) => {
        const node: Node = {
          id: calc.getAttribute("name") || "",
          name: calc.getAttribute("caption") || calc.getAttribute("name") || "",
          type: "calculation",
          caption: calc.getAttribute("caption") || undefined,
          formula: calc.getAttribute("formula") || undefined,
          calculation: calc.textContent || undefined,
          class: calc.getAttribute("class") as "tableau" | undefined,
          paramDomainType: calc.getAttribute("param-domain-type") as
            | "list"
            | "range"
            | undefined,
        };

        // Parse members if present
        const members = calc.querySelectorAll("members > member");
        if (members.length > 0) {
          node.members = Array.from(members).map(
            (member) => member.getAttribute("value") || ""
          );
        }

        // Parse aliases if present
        const aliases = calc.querySelectorAll("aliases > alias");
        if (aliases.length > 0) {
          node.aliases = {};
          aliases.forEach((alias) => {
            const key = alias.getAttribute("key") || "";
            const value = alias.getAttribute("value") || "";
            if (node.aliases && key && value) {
              node.aliases[key] = value;
            }
          });
        }

        nodes.push(node);

        // Parse references
        const formula = calc.getAttribute("formula") || "";
        const referencedFields = formula.match(/\[([^\]]+)\]/g) || [];
        referencedFields.forEach((field) => {
          const fieldName = field.slice(1, -1);
          references.push({
            sourceId: node.id,
            targetId: fieldName,
            type: "direct",
          });
        });
      });

      const nodesById = new Map(nodes.map((node) => [node.id, node]));

      setFileData({
        filename: file.name,
        nodesById,
        references,
      });
    };

    reader.readAsText(file);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={onFileChange}
        style={{ display: "none" }}
        accept=".twb"
      />
      <Box sx={{ display: "flex", alignItems: "center" }}>
        {fileData && (
          <Typography variant="body2" sx={{ mr: 2, color: "inherit" }}>
            {fileData.filename}
          </Typography>
        )}
        <Button
          variant="contained"
          onClick={handleUploadClick}
          startIcon={<Upload />}
          size="small"
          sx={{
            backgroundColor: "rgba(255, 255, 255, 0.1)",
            "&:hover": {
              backgroundColor: "rgba(255, 255, 255, 0.2)",
            },
          }}
        >
          Upload Tableau Workbook
        </Button>
      </Box>
    </>
  );
};

export default FileUpload;
