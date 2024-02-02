import React from "react";
import {
  List,
  ListItem,
  ListItemText,
  Autocomplete,
  Container,
  TextField,
} from "@mui/material";

export default class DataList extends React.Component {
  state = {
    selectedFilter: null,
  };

  renderListItem = (node, parentKey, parentName) => {
    const key = parentKey ? `${parentKey}/${node.name}` : node.name;
    const tempName = node?.caption ?? node.name;
    const name = parentName ? `${parentName}/${tempName}` : tempName;
    const nodeRender = (
      <ListItem key={key}>
        <ListItemText primary={name} />
      </ListItem>
    );
    if (node.usedIn) {
      return [
        nodeRender,
        ..._.flatten(
          node.usedIn.map((nodeUsedIn) =>
            this.renderListItem(nodeUsedIn, key, name)
          )
        ),
      ];
    }

    return [nodeRender];
  };

  renderListItems = () => {
    if (this.state.selectedFilter) {
      return this.renderListItem(
        this.props.data.nodes.find(
          (node) => node.name === this.state.selectedFilter.name
        )
      );
    }

    return _.flatten(
      this.props.data.nodes.map((node) => this.renderListItem(node))
    );
  };

  getAutocompleteValue = (node) => {
    return {
      label: node?.caption ?? node.name,
      originalNode: node,
    };
  };

  render() {
    return (
      <Container disableGutters maxWidth="lg" component="div" sx={{ py: 4 }}>
        <Autocomplete
          disablePortal
          options={this.props.data.nodes.map(this.getAutocompleteValue)}
          sx={{ width: 300 }}
          renderInput={(params) => <TextField {...params} label="Filter" />}
          onChange={(event, value) => {
            this.setState({ selectedFilter: value?.originalNode ?? null });
          }}
          value={
            this.state.selectedFilter
              ? this.getAutocompleteValue(this.state.selectedFilter)
              : null
          }
          isOptionEqualToValue={(option, value) => option.label === value.label}
        />
        <List>{this.renderListItems()}</List>
      </Container>
    );
  }
}
