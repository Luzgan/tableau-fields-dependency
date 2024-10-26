import React from "react";
import { Outlet } from "react-router-dom";
import FieldsList from "./FieldsList";
import { Box } from "@mui/material";
import FieldDetails from "./FieldDetails";

export default class FieldsTab extends React.Component {
  state = {
    subpage: null,
    selectedField: null,
  };

  onSelectField = (key) => {
    this.setState({ selectedField: key, subpage: "mainField" });
  };

  goToSubpage = (key) => {
    if (key === null) {
      this.setState({ selectedField: null, subpage: null });
    } else {
      this.setState({ subpage: key });
    }
  };

  render() {
    return (
      <Box maxWidth="lg" component="div" sx={{ py: 4 }} display={"flex"}>
        <FieldsList
          data={this.props.data}
          selectedField={this.state.selectedField}
          onSelectField={this.onSelectField}
        />
        <Outlet />
      </Box>
    );
  }
}
