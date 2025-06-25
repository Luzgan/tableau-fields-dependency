import { Box, Grid } from "@mui/material";
import React from "react";
import { Route, Routes } from "react-router-dom";
import FieldDetails from "./FieldDetails";
import FieldsList from "./FieldsList";
import NoFieldSelected from "./NoFieldSelected";

const FieldsTab: React.FC = () => {
  return (
    <Box sx={{ flex: 1, display: "flex", overflow: "hidden" }}>
      <Grid container spacing={0} sx={{ flex: 1 }}>
        <Grid
          item
          xs={3}
          sx={{
            height: "100%",
            overflow: "hidden",
            display: "flex",
            borderRight: 2,
            borderColor: "divider",
            bgcolor: "background.paper",
            boxShadow: 1,
          }}
        >
          <FieldsList />
        </Grid>
        <Grid
          item
          xs={9}
          sx={{
            height: "100%",
            overflow: "auto",
            display: "flex",
            p: 3,
            bgcolor: "grey.50",
          }}
        >
          <Box sx={{ width: "100%" }}>
            <Routes>
              <Route path="/" element={<NoFieldSelected />} />
              <Route path="/field/:id" element={<FieldDetails />} />
            </Routes>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default FieldsTab;
