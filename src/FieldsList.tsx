import {
  Box,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  TextField,
  Typography,
} from "@mui/material";
import React, { useState } from "react";
import { useAppContext } from "./AppContext";
import { Node, NodeType } from "./types";

interface FieldsListProps {
  onFieldSelect: (field: Node | null) => void;
}

const FieldsList: React.FC<FieldsListProps> = ({ onFieldSelect }) => {
  const { helpers } = useAppContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<NodeType[]>([
    "column",
    "calculation",
  ]);

  const nodes = helpers.getNodes();

  const filterNodes = (nodes: Node[]) => {
    return nodes.filter((node) => {
      const matchesSearch =
        node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        node.caption?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        false;
      const matchesType = selectedTypes.includes(node.type);
      return matchesSearch && matchesType;
    });
  };

  const handleTypeChange = (type: NodeType) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const filteredNodes = filterNodes(nodes);

  return (
    <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
      <Box sx={{ p: 2 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search fields..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ mb: 2 }}
        />
        <FormControl component="fieldset">
          <FormGroup row>
            <FormControlLabel
              control={
                <Checkbox
                  checked={selectedTypes.includes("column")}
                  onChange={() => handleTypeChange("column")}
                />
              }
              label="Columns"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={selectedTypes.includes("calculation")}
                  onChange={() => handleTypeChange("calculation")}
                />
              }
              label="Calculations"
            />
          </FormGroup>
        </FormControl>
      </Box>
      <Box sx={{ flex: 1, overflow: "auto", px: 2 }}>
        {filteredNodes.map((node) => (
          <Box
            key={node.id}
            onClick={() => onFieldSelect(node)}
            sx={{
              p: 2,
              mb: 1,
              cursor: "pointer",
              backgroundColor: "grey.100",
              borderRadius: 1,
              "&:hover": {
                backgroundColor: "grey.200",
              },
            }}
          >
            <Typography>{node.name}</Typography>
            <Typography variant="caption" color="text.secondary">
              {node.type}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default FieldsList;
