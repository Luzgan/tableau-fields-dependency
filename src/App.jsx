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

export default class App extends React.Component {
  state = {
    data: null,
  };

  setFileData = (data) => {
    this.setState({ data });
  };

  render() {
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
        <Box style={{ height: "64px" }}></Box>
        <Container maxWidth="lg" component="main" sx={{ pt: 2, pb: 4 }}>
          <Typography
            variant="h5"
            align="center"
            color="text.secondary"
            component="p"
          >
            Choose *.twb file below.
          </Typography>
          <FileUpload setFileData={this.setFileData} />
          {this.state.data && <Data data={this.state.data} />}
          {/* <Graph data={this.state.data} /> */}
        </Container>
      </ThemeProvider>
    );
  }
}
