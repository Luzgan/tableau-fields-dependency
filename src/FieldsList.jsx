import React from "react";
import {
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Box,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import * as _ from "lodash";
import * as escape from "escape-string-regexp";

export default class FieldsList extends React.Component {
  state = {
    search: null,
    fieldTypeFilter: "all",
  };

  onFieldTypeSelect = (event) => {
    this.setState({ fieldTypeFilter: event.target.value });
  };

  debouncedSetSearch = _.debounce((search) => {
    this.setState({
      search,
    });
  }, 300);

  onSearchChange = (event) => {
    this.debouncedSetSearch(event.target.value);
  };

  renderField = (node) => {
    const { onSelectField, selectedField } = this.props;
    const key = node.id;
    const name = node?.caption ?? node.name;
    return (
      <ListItemButton
        key={key}
        selected={selectedField === key}
        onClick={() => onSelectField(key)}
      >
        <ListItemText primary={name} secondary={node?.fieldtype} />
      </ListItemButton>
    );
  };

  filterNodes = () => {
    let filteredNodes = this.props.data.nodes;
    if (this.state.fieldTypeFilter !== "all") {
      filteredNodes = _.filter(
        filteredNodes,
        (value) => value.fieldtype === this.state.fieldTypeFilter
      );
    }

    if (this.state.search) {
      const regexp = new RegExp(escape.default(this.state.search), "i");
      filteredNodes = _.filter(
        filteredNodes,
        (value) => regexp.test(value.name) || regexp.test(value.caption)
      );
    }

    return filteredNodes;
  };

  renderFields = () => {
    const renderNodes = this.filterNodes();
    return renderNodes.map((node) => this.renderField(node));
  };

  render() {
    return (
      <Box sx={{ width: "100%", maxWidth: 240 }}>
        <TextField
          style={{ width: "100%", marginBottom: "12px" }}
          id="field-search"
          label="Search"
          onChange={this.onSearchChange}
        />
        <FormControl style={{ width: "100%", marginBottom: "24px" }}>
          <InputLabel id="field-type-select-label">Field type</InputLabel>
          <Select
            style={{ width: "100%" }}
            labelId="field-type-select-label"
            id="field-type-select"
            value={this.state.fieldTypeFilter}
            label="Field type"
            onChange={this.onFieldTypeSelect}
          >
            <MenuItem value={"all"}>All</MenuItem>
            <MenuItem value={"parameter"}>Parameter</MenuItem>
            <MenuItem value={"calculation"}>Calculation</MenuItem>
            <MenuItem value={"sourcefield"}>Sourcefield</MenuItem>
          </Select>
        </FormControl>

        <List component="nav" aria-label="Fields selection">
          {this.renderFields()}
        </List>
      </Box>
    );
  }
}
