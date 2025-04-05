import { Upload } from "@mui/icons-material";
import { Box, Button, Typography, Alert } from "@mui/material";
import React, { useRef, useState } from "react";
import { useAppContext } from "./AppContext";
import { FileData } from "./types";
import { parseTWB } from "./twb-parser";
import { transformTWBData } from "./twb-transformer";

const FileUpload: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { fileData, setFileData } = useAppContext();
  const [error, setError] = useState<string | null>(null);

  const onFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Clear previous error
    setError(null);

    try {
      console.log("\n=== Processing TWB File ===");
      console.log("File name:", file.name);

      // Parse TWB file
      const datasources = await parseTWB(file);
      console.log(`Number of datasources: ${datasources.length}`);

      // Transform into our internal format
      const transformedData = transformTWBData(datasources, file.name);

      // Log summary
      const nodes = Array.from(transformedData.nodesById.values());
      const columnNodes = nodes.filter((node) => node.type === "column");
      const calculationNodes = nodes.filter(
        (node) => node.type === "calculation"
      );
      const parameterNodes = calculationNodes.filter(
        (node) => "paramDomainType" in node && node.paramDomainType
      );

      console.log("\n=== File Analysis Summary ===");
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
    } catch (error) {
      console.error("Error processing TWB file:", error);
      setError(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while processing the file"
      );
      setFileData(null);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 2,
        p: 3,
        width: "100%",
        maxWidth: 600,
      }}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={onFileChange}
        accept=".twb"
        style={{ display: "none" }}
      />
      <Button
        variant="contained"
        onClick={handleUploadClick}
        startIcon={<Upload />}
        sx={{ minWidth: 200 }}
      >
        Upload TWB File
      </Button>
      {error && (
        <Alert severity="error" sx={{ width: "100%" }}>
          {error}
        </Alert>
      )}
      {fileData && !error && (
        <Alert severity="success" sx={{ width: "100%" }}>
          Successfully loaded: {fileData.filename}
          <Typography variant="body2" sx={{ mt: 1 }}>
            Found {fileData.nodesById.size} nodes and{" "}
            {fileData.references.length} references
          </Typography>
        </Alert>
      )}
    </Box>
  );
};

export default FileUpload;
