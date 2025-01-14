import React from "react";
import { Box, Typography } from "@mui/material";
export default function NoFieldSelected() {
  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Typography
        variant="h5"
        align="center"
        color="text.secondary"
        component="p"
      >
        Choose field on the left to see the details.
      </Typography>
    </Box>
  );
}
