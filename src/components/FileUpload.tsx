import { Upload } from "@mui/icons-material";
import { Box, Button } from "@mui/material";
import React, { RefObject } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "./AppContext";
import { useNotification } from "./Notification";
import { parseTWB } from "../utils/twbParser";
import { transformTWBData } from "../utils/twbTransformer";

interface FileUploadProps {
  fileInputRef: RefObject<HTMLInputElement>;
}

const FileUpload: React.FC<FileUploadProps> = ({ fileInputRef }) => {
  const { setFileData } = useAppContext();
  const { showNotification } = useNotification();
  const navigate = useNavigate();

  const resetFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const onFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Clear existing data and navigate to root before processing new file
    setFileData(null);
    navigate("/");

    try {
      const datasources = await parseTWB(file);
      const transformedData = transformTWBData(datasources);
      const nodes = Array.from(transformedData.nodesById.values());

      setFileData(transformedData);
      showNotification(
        `Successfully loaded: ${file.name} (${nodes.length} nodes, ${transformedData.references.length} references)`,
        "success"
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while processing the file";

      showNotification(errorMessage, "error");
      resetFileInput();
    }
  };

  return (
    <Box>
      <input
        ref={fileInputRef}
        type="file"
        accept=".twb"
        onChange={onFileChange}
        style={{ display: "none" }}
      />
      <Button
        variant="contained"
        component="label"
        size="small"
        onClick={() => fileInputRef.current?.click()}
        startIcon={<Upload />}
        sx={{
          bgcolor: "rgba(255, 255, 255, 0.1)",
          "&:hover": {
            bgcolor: "rgba(255, 255, 255, 0.2)",
          },
        }}
      >
        Upload TWB file
      </Button>
    </Box>
  );
};

export default FileUpload;
