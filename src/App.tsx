import {
  Box,
  CssBaseline,
  ThemeProvider,
  Typography,
  createTheme,
  IconButton,
} from "@mui/material";
import { Clear } from "@mui/icons-material";
import React, { useState } from "react";
import { AppProvider, useAppContext } from "./AppContext";
import FieldDetails from "./FieldDetails";
import FieldsList from "./FieldsList";
import FileUpload from "./FileUpload";
import { Node } from "./types";
import { NotificationProvider } from "./components/Notification";

const theme = createTheme();

function AppContent() {
  const [selectedField, setSelectedField] = useState<Node | null>(null);
  const { fileData, setFileData } = useAppContext();

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
          height: 48,
          width: "100%",
          display: "flex",
          alignItems: "center",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            px: 2,
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <Typography variant="h6" component="div" sx={{ fontSize: "1.1rem" }}>
            Tableau Fields Dependency
          </Typography>
          <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
            {hasLoadedFile && (
              <>
                <Typography
                  variant="body2"
                  sx={{
                    color: "primary.contrastText",
                    opacity: 0.9,
                    mr: 1,
                  }}
                >
                  {fileData.filename}
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => setFileData(null)}
                  aria-label="Clear"
                  sx={{
                    color: "primary.contrastText",
                    p: 0.5,
                    "&:hover": {
                      bgcolor: "rgba(255, 255, 255, 0.1)",
                    },
                  }}
                >
                  <Clear fontSize="small" />
                </IconButton>
              </>
            )}
            <FileUpload />
          </Box>
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

const App: React.FC = () => {
  return (
    <AppProvider>
      <NotificationProvider>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <AppContent />
        </ThemeProvider>
      </NotificationProvider>
    </AppProvider>
  );
};

export default App;
