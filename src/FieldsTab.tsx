import { Box, Grid } from "@mui/material";
import React, { useState } from "react";
import FieldDetails from "./FieldDetails";
import FieldsList from "./FieldsList";
import NoFieldSelected from "./NoFieldSelected";
import { Node } from "./types";

const FieldsTab: React.FC = () => {
  const [selectedField, setSelectedField] = useState<Node | null>(null);

  return (
    <Box sx={{ flex: 1, display: "flex", overflow: "hidden" }}>
      <Grid container spacing={2} sx={{ flex: 1, margin: 0, width: "auto" }}>
        <Grid
          item
          xs={4}
          sx={{
            height: "100%",
            overflow: "hidden",
            display: "flex",
            paddingTop: "16px !important",
          }}
        >
          <FieldsList onFieldSelect={setSelectedField} />
        </Grid>
        <Grid
          item
          xs={8}
          sx={{
            height: "100%",
            overflow: "hidden",
            display: "flex",
            paddingTop: "16px !important",
          }}
        >
          {selectedField ? (
            <FieldDetails field={selectedField} />
          ) : (
            <NoFieldSelected />
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default FieldsTab;
