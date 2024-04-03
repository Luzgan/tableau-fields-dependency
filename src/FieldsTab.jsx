import React from "react";
import FieldsList from "./FieldsList";
import { Box } from "@mui/material";
import FieldDetails from "./FieldDetails";

export default class FieldsTab extends React.Component {
  state = {
    selectedField: null,
  };

  onSelectField = (key) => {
    this.setState({ selectedField: key });
  };

  render() {
    return (
      <Box maxWidth="lg" component="div" sx={{ py: 4 }} display={"flex"}>
        <FieldsList
          data={this.props.data}
          selectedField={this.state.selectedField}
          onSelectField={this.onSelectField}
        />
        <FieldDetails
          data={this.props.data}
          selectedField={this.state.selectedField}
        />
      </Box>
    );
  }
}
