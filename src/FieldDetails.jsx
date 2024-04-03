import React from "react";
import { Box, Typography } from "@mui/material";

export default class FieldDetails extends React.Component {
  renderFieldDetails = () => {
    const selectedField = this.props.data.nodes.find(
      (node) => node.id === this.props.selectedField
    );
    return (
      <Box sx={{ px: 2 }}>
        <Box display="flex">
          <Typography variant="h6" component="p">
            Name:
          </Typography>
          <Typography variant="body2" component="p">
            {selectedField.caption ?? selectedField.name}
          </Typography>
        </Box>
      </Box>
    );
  };

  render() {
    return (
      <Box maxWidth="lg" component="div" flexGrow={1}>
        {this.props.selectedField === null && (
          <Typography
            variant="h5"
            align="center"
            color="text.secondary"
            component="p"
          >
            Choose field on the left to see the details.
          </Typography>
        )}
        {this.props.selectedField !== null && this.renderFieldDetails()}
      </Box>
    );
  }
}
