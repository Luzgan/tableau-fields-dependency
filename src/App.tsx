import {
  Box,
  CssBaseline,
  ThemeProvider,
  Typography,
  createTheme,
} from "@mui/material";
import React, { useState } from "react";
import { AppProvider, useAppContext } from "./AppContext";
import FieldDetails from "./FieldDetails";
import FieldsList from "./FieldsList";
import FileUpload from "./FileUpload";
import { Node } from "./types";

const theme = createTheme();

function AppContent() {
  const [selectedField, setSelectedField] = useState<Node | null>(null);
  const { fileData } = useAppContext();

  const hasLoadedFile = fileData !== null;

  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        bgcolor: "grey.50",
      }}
    >
      <Box
        sx={{
          bgcolor: "primary.main",
          color: "primary.contrastText",
          py: 1,
          width: "100%",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            px: 3,
            justifyContent: "space-between",
          }}
        >
          <Typography variant="h6" component="div">
            Tableau Fields Dependency
          </Typography>
          <FileUpload />
        </Box>
      </Box>
      {hasLoadedFile ? (
        <Box sx={{ flex: 1, display: "flex", overflow: "hidden" }}>
          <Box
            sx={{
              width: 300,
              borderRight: 1,
              borderColor: "divider",
              bgcolor: "background.paper",
              overflow: "auto",
            }}
          >
            <FieldsList onFieldSelect={setSelectedField} />
          </Box>
          <Box sx={{ flex: 1, overflow: "auto", p: 3 }}>
            {selectedField ? (
              <FieldDetails field={selectedField} />
            ) : (
              <Box
                sx={{
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "text.secondary",
                }}
              >
                Select a field to view details
              </Box>
            )}
          </Box>
        </Box>
      ) : (
        <Box
          sx={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "text.secondary",
          }}
        >
          Upload a Tableau workbook to view fields
        </Box>
      )}
    </Box>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ThemeProvider>
  );
}

export default App;
