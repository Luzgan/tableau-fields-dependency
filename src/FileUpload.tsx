import { Upload } from "@mui/icons-material";
import { Box, Button } from "@mui/material";
import React, { useRef, useEffect } from "react";
import { useAppContext } from "./AppContext";
import { useNotification } from "./components/Notification";
import { FileData, ColumnNode, CalculationNode } from "./types";
import { parseTWB } from "./twb-parser";
import { transformTWBData } from "./twb-transformer";

const FileUpload: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { fileData, setFileData } = useAppContext();
  const { showNotification } = useNotification();

  const resetFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const onFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Clear existing data before processing new file
    setFileData(null);

    try {
      console.log("\n=== Processing TWB File ===");
      console.log("File name:", file.name);

      // Parse TWB file
      const datasources = await parseTWB(file);
      console.log("Parsed datasources:", datasources);

      // Transform data
      const transformedData = transformTWBData(datasources, file.name);
      const nodes = Array.from(transformedData.nodesById.values());
      const columnNodes = nodes.filter(
        (node): node is ColumnNode => node.type === "column"
      );
      const calculationNodes = nodes.filter(
        (node): node is CalculationNode => node.type === "calculation"
      );
      const parameterNodes = nodes.filter((node) => node.type === "parameter");

      // Log summary
      console.log("\n=== Data Summary ===");
      console.log(`Total nodes: ${nodes.length}`);
      console.log(`Column nodes: ${columnNodes.length}`);
      console.log(`Calculation nodes: ${calculationNodes.length}`);
      console.log(`Parameter nodes: ${parameterNodes.length}`);
      console.log(`Total references: ${transformedData.references.length}`);
      console.log(
        `Direct references: ${
          transformedData.references.filter((ref) => ref.type === "direct")
            .length
        }`
      );
      console.log(
        `Indirect references: ${
          transformedData.references.filter((ref) => ref.type === "indirect")
            .length
        }`
      );

      // Update app state
      setFileData(transformedData);

      // Show success notification
      showNotification(
        `Successfully loaded: ${file.name} (${nodes.length} nodes, ${transformedData.references.length} references)`,
        "success"
      );
    } catch (error) {
      console.error("Error processing TWB file:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while processing the file";

      showNotification(errorMessage, "error");
      setFileData(null);
    } finally {
      // Always reset the file input after processing
      resetFileInput();
    }
  };

  const handleUploadClick = () => {
    // Reset the input before opening the file dialog
    resetFileInput();
    fileInputRef.current?.click();
  };

  return (
    <Box>
      <input
        type="file"
        ref={fileInputRef}
        onChange={onFileChange}
        accept=".twb"
        style={{ display: "none" }}
      />
      <Button
        onClick={handleUploadClick}
        size="small"
        startIcon={<Upload />}
        sx={{
          color: "primary.contrastText",
          textTransform: "none",
          "&:hover": {
            bgcolor: "rgba(255, 255, 255, 0.1)",
          },
        }}
      >
        Upload TWB file
      </Button>
    </Box>
  );
};

export default FileUpload;
