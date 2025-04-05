import {
  Box,
  TextField,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  IconButton,
  Collapse,
  Tooltip,
} from "@mui/material";
import {
  TableChart as ColumnIcon,
  Functions as CalculationIcon,
  Tune as ParameterIcon,
  FilterList as FilterIcon,
} from "@mui/icons-material";
import React, { useState } from "react";
import { useAppContext } from "./AppContext";
import { Node, NodeType } from "./types";

interface FieldsListProps {
  onFieldSelect: (field: Node | null) => void;
}

const nodeTypeConfig = {
  column: {
    icon: ColumnIcon,
    color: "#1976d2", // blue
    label: "Columns",
  },
  calculation: {
    icon: CalculationIcon,
    color: "#2e7d32", // green
    label: "Calculations",
  },
  parameter: {
    icon: ParameterIcon,
    color: "#ed6c02", // orange
    label: "Parameters",
  },
};

const FieldsList: React.FC<FieldsListProps> = ({ onFieldSelect }) => {
  const { helpers } = useAppContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<NodeType[]>([
    "column",
    "calculation",
    "parameter",
  ]);

  const nodes = helpers.getNodes();

  const filterNodes = (nodes: Node[]) => {
    return nodes.filter((node) => {
      const matchesSearch =
        node.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        node.caption?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        false;
      const matchesType = selectedTypes.includes(node.type);
      return matchesSearch && matchesType;
    });
  };

  const handleTypeChange = (
    _event: React.MouseEvent<HTMLElement>,
    newTypes: NodeType[]
  ) => {
    // Ensure at least one type is selected
    if (newTypes.length > 0) {
      setSelectedTypes(newTypes);
    }
  };

  const filteredNodes = filterNodes(nodes);

  return (
    <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
          <TextField
            size="small"
            placeholder="Search fields..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ flex: 1 }}
          />
          <Tooltip title={`${showFilters ? "Hide" : "Show"} filters`}>
            <IconButton
              size="small"
              onClick={() => setShowFilters(!showFilters)}
              sx={{
                backgroundColor: showFilters
                  ? "action.selected"
                  : "transparent",
                "&:hover": {
                  backgroundColor: showFilters
                    ? "action.selected"
                    : "action.hover",
                },
              }}
            >
              <FilterIcon />
            </IconButton>
          </Tooltip>
        </Box>
        <Collapse in={showFilters}>
          <ToggleButtonGroup
            value={selectedTypes}
            onChange={handleTypeChange}
            aria-label="field types"
            size="small"
            orientation="vertical"
            sx={{
              width: "100%",
              mb: 2,
              "& .MuiToggleButton-root": {
                textTransform: "none",
                justifyContent: "flex-start",
                px: 1.5,
                py: 0.7,
                borderRadius: "4px !important",
                border: "none !important",
                mb: 0.5,
                "&:not(:first-of-type)": {
                  borderRadius: "4px !important",
                },
              },
            }}
          >
            {(Object.keys(nodeTypeConfig) as NodeType[]).map((type) => {
              const Icon = nodeTypeConfig[type].icon;
              const config = nodeTypeConfig[type];
              return (
                <ToggleButton
                  key={type}
                  value={type}
                  aria-label={type}
                  sx={{
                    backgroundColor: `${config.color}10 !important`,
                    "&.Mui-selected": {
                      backgroundColor: `${config.color}20 !important`,
                      color: `${config.color} !important`,
                    },
                    "&:hover": {
                      backgroundColor: `${config.color}30 !important`,
                    },
                  }}
                >
                  <Icon sx={{ mr: 1, fontSize: "1.2rem" }} />
                  {config.label}
                </ToggleButton>
              );
            })}
          </ToggleButtonGroup>
        </Collapse>
      </Box>
      <Box sx={{ flex: 1, overflow: "auto", px: 2 }}>
        {filteredNodes.map((node) => {
          const config = nodeTypeConfig[node.type];
          const Icon = config.icon;
          return (
            <Box
              key={node.id}
              onClick={() => onFieldSelect(node)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  onFieldSelect(node);
                }
              }}
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
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Icon sx={{ color: config.color, mr: 1, fontSize: "1.2rem" }} />
                <Typography>{node.displayName}</Typography>
              </Box>
              <Typography
                variant="caption"
                sx={{
                  color: config.color,
                  display: "flex",
                  alignItems: "center",
                  ml: 3.2, // To align with the text above
                }}
              >
                {node.type}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

export default FieldsList;
