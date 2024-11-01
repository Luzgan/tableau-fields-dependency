import React from "react";
import { Typography } from "@mui/material";
export default function NoFieldSelected() {
  return (
    <Typography
      variant="h5"
      align="center"
      color="text.secondary"
      component="p"
    >
      Choose field on the left to see the details.
    </Typography>
  );
}
