import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
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

const filterNodes = (data, fieldTypeFilter, search) => {
  let filteredNodes = [...data.nodes];
  if (fieldTypeFilter !== "all") {
    filteredNodes = _.filter(
      filteredNodes,
      (value) => value.fieldtype === fieldTypeFilter
    );
  }

  if (search) {
    const regexp = new RegExp(escape.default(search), "i");
    filteredNodes = _.filter(
      filteredNodes,
      (value) => regexp.test(value.name) || regexp.test(value.caption)
    );
  }

  return filteredNodes;
};

function Field(props) {
  const { node } = props;
  const navigate = useNavigate();

  const key = node.id;
  const name = node?.caption ?? node.name;

  const onSelectField = useCallback(() => {
    navigate(`field/${key}`);
  });

  return (
    <ListItemButton key={key} selected={null === key} onClick={onSelectField}>
      <ListItemText primary={name} secondary={node?.fieldtype} />
    </ListItemButton>
  );
}

export default function FieldsList(props) {
  const [search, setSearch] = useState(null);
  const [fieldTypeFilter, setFieldTypeFilter] = useState("all");

  const onFieldTypeSelect = useCallback((event) => {
    setFieldTypeFilter(event.target.value);
  }, []);

  const debouncedSetSearch = _.debounce((search) => {
    setSearch(search);
  }, 300);

  const onSearchChange = useCallback((event) => {
    debouncedSetSearch(event.target.value);
  });

  const renderNodes = filterNodes(props.data, fieldTypeFilter, search);

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: 240,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <TextField
        style={{ width: "100%", marginBottom: "12px" }}
        id="field-search"
        label="Search"
        onChange={onSearchChange}
      />
      <FormControl style={{ width: "100%", marginBottom: "12px" }}>
        <InputLabel id="field-type-select-label">Field type</InputLabel>
        <Select
          style={{ width: "100%" }}
          labelId="field-type-select-label"
          id="field-type-select"
          value={fieldTypeFilter}
          label="Field type"
          onChange={onFieldTypeSelect}
        >
          <MenuItem value={"all"}>All</MenuItem>
          <MenuItem value={"parameter"}>Parameter</MenuItem>
          <MenuItem value={"calculation"}>Calculation</MenuItem>
          <MenuItem value={"sourcefield"}>Sourcefield</MenuItem>
        </Select>
      </FormControl>

      <List
        component="nav"
        aria-label="Fields selection"
        sx={{ overflow: "scroll", pt: 0 }}
      >
        {renderNodes.map((node) => (
          <Field node={node} key={node.id} />
        ))}
      </List>
    </Box>
  );
}
