import React from "react";
import he from "he";
import { Box, Typography, Grid, Button, Link } from "@mui/material";
import { ArrowBackIos } from "@mui/icons-material";

export default class FieldDetails extends React.Component {
  renderLine = (label, value) => {
    return (
      <Grid
        sx={{ px: 2 }}
        paddingY={1}
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

  goBack = () => {
    if (this.props.subpage === "mainField") {
      this.props.goToSubpage(null);
    } else {
      this.props.goToSubpage("mainField");
    }
  };

  getFieldName = (field) => {
    return field.caption ?? field.name;
  };

  renderFieldDetails = () => {
    const selectedField = this.props.data.nodes.find(
      (node) => node.id === this.props.selectedField
    );

    return (
      <>
        {this.renderLine("Name:", this.getFieldName(selectedField))}
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
          <Link href="#">{selectedField?.usedIn?.length ?? 0}</Link>
        )}
        {this.renderLine(
          "No. indirect references:",
          <Link href="#">{selectedField?.usedInDeep?.length ?? 0}</Link>
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

  renderFieldDirectReferences = () => {
    <>{this.renderLine("test:", "")}</>;
  };

  renderFieldIndirectReferences = () => {
    <>{this.renderLine("test:", "")}</>;
  };

  render() {
    console.log(this.props);
    return (
      <Box maxWidth="lg" component="div" flexGrow={1}>
        {/* {this.props.subpage !== null && (
          <Box sx={{ px: 2 }}>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIos />}
              onClick={this.goBack}
            >
              Go back
            </Button>
          </Box>
        )}
        {this.props.subpage === null && (
          <Typography
            variant="h5"
            align="center"
            color="text.secondary"
            component="p"
          >
            Choose field on the left to see the details.
          </Typography>
        )}
        {this.props.subpage === "mainField" && this.renderFieldDetails()}
        {this.props.subpage === "directReferences" &&
          this.renderFieldDirectReferences()}
        {this.props.subpage === "indirectReferences" &&
          this.renderFieldDirectReferences()} */}
      </Box>
    );
  }
}
