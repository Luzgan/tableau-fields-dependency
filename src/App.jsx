import React from "react";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import {
  CssBaseline,
  GlobalStyles,
  Typography,
  Container,
  AppBar,
  Toolbar,
  Box,
} from "@mui/material";
import FileUpload from "./FileUpload";
import Data from "./Data";

const defaultTheme = createTheme();

export default function App(props) {
  return (
    <ThemeProvider theme={defaultTheme}>
      <GlobalStyles styles={{}} />
      <CssBaseline />
      <AppBar component="nav">
        <Toolbar>
          <Typography style={{ flexGrow: 1 }} component="div" variant="h6">
            Tableau field explorer
          </Typography>
        </Toolbar>
      </AppBar>
      <Box style={{ height: "10vh" }}></Box>
      <Container
        maxWidth="lg"
        component="main"
        sx={{
          pt: 0,
          pb: 0,
          height: "90vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Typography
          variant="h5"
          align="center"
          color="text.secondary"
          component="p"
        >
          Choose *.twb file below.
        </Typography>
        <FileUpload setFileData={props.setFileData} />
        {props.data && <Data data={props.data} />}
      </Container>
    </ThemeProvider>
  );
}
