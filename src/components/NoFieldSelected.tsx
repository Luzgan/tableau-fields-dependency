import { Box, Paper, Typography } from "@mui/material";
import React from "react";

const NoFieldSelected: React.FC = () => {
  return (
    <Paper sx={{ p: 4, textAlign: "center" }}>
      <Box>
        <Typography variant="h6" color="text.secondary">
          No field selected
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Select a field from the list to view its details
        </Typography>
      </Box>
    </Paper>
  );
};

export default NoFieldSelected;
