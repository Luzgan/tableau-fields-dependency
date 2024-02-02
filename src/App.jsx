import React from "react";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import GlobalStyles from "@mui/material/GlobalStyles";
import FileUpload from "./FileUpload";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";
import Data from "./Data";
import Graph from "./Graph";

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
        <Container
          disableGutters
          maxWidth="lg"
          component="main"
          sx={{ pt: 8, pb: 4 }}
        >
          <Typography
            component="h1"
            variant="h2"
            align="center"
            color="text.primary"
            gutterBottom
          >
            Tableau field dependency reader
          </Typography>
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
