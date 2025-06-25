import { Box, Grid } from "@mui/material";
import React, { Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import FieldsList from "./FieldsList";
import NoFieldSelected from "./NoFieldSelected";

// Lazy load the heaviest component
const FieldDetails = React.lazy(() => import("./FieldDetails"));

// Loading fallback for field details
const FieldDetailsLoading: React.FC = () => (
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      height: "100%",
      color: "text.secondary",
    }}
  >
    Loading field details...
  </Box>
);

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
              <Route
                path="/field/:id"
                element={
                  <Suspense fallback={<FieldDetailsLoading />}>
                    <FieldDetails />
                  </Suspense>
                }
              />
            </Routes>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default FieldsTab;
