import React from "react";
import he from "he";
import { Box, Typography, Grid } from "@mui/material";

export default class FieldDetails extends React.Component {
  renderLine = (label, value) => {
    return (
      <Grid
        sx={{ px: 2 }}
        maxWidth={1600}
        container
        spacing={2}
        alignItems="center"
      >
        <Grid item xs={5}>
          <Typography variant="h6">{label}</Typography>
        </Grid>
        <Grid item xs={7}>
          <Typography variant="body1">{value}</Typography>
        </Grid>
      </Grid>
    );
  };
  renderFieldDetails = () => {
    const selectedField = this.props.data.nodes.find(
      (node) => node.id === this.props.selectedField
    );

    return (
      <>
        {this.renderLine("Name:", selectedField.caption ?? selectedField.name)}
        {this.renderLine("Field type:", selectedField.fieldtype)}
        {this.renderLine("Role:", selectedField.role)}
        {this.renderLine("Data type:", selectedField.datatype)}
        {selectedField.fieldtype === "calculation"
          ? this.renderLine(
              "Calculation:",
              he.decode(selectedField.calculation)
            )
          : null}
        {this.renderLine(
          "No. direct references:",
          selectedField?.usedIn?.length ?? 0
        )}
        {this.renderLine(
          "No. indirect references:",
          selectedField?.usedInDeep?.length ?? 0
        )}
      </>
    );
    // return (
    //   <Box sx={{ px: 2 }}>
    //     <Box display="flex">
    //       <Typography variant="h6" component="p">
    //         Name:
    //       </Typography>
    //       <Typography variant="body2" component="p">
    //         {selectedField.caption ?? selectedField.name}
    //       </Typography>
    //     </Box>
    //   </Box>
    // );
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
