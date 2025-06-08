import {
  Box,
  CssBaseline,
  ThemeProvider,
  Typography,
  createTheme,
  IconButton,
} from "@mui/material";
import { Clear } from "@mui/icons-material";
import React, { useRef } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { NotificationProvider } from "./Notification";
import { useAppContext } from "./AppContext";
import FieldsTab from "./FieldsTab";
import FileUpload from "./FileUpload";

const theme = createTheme();

function AppContent() {
  const { fileData, setFileData } = useAppContext();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasLoadedFile = fileData !== null;

  const handleClearFile = () => {
    setFileData(null);
    navigate("/");
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

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
                  onClick={handleClearFile}
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
            <FileUpload fileInputRef={fileInputRef} />
          </Box>
        </Box>
      </Box>
      {hasLoadedFile ? (
        <Box sx={{ flex: 1, display: "flex", overflow: "hidden" }}>
          <Routes>
            <Route path="/*" element={<FieldsTab />} />
          </Routes>
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
    <NotificationProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AppContent />
      </ThemeProvider>
    </NotificationProvider>
  );
};

export default App;
