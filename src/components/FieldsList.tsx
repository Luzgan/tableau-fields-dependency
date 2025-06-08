import {
  Box,
  TextField,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  IconButton,
  Collapse,
  Tooltip,
  Chip,
} from "@mui/material";
import {
  TableChart as ColumnIcon,
  Functions as CalculationIcon,
  Tune as ParameterIcon,
  FilterList as FilterIcon,
} from "@mui/icons-material";
import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAppContext } from "./AppContext";
import { Node, NodeType } from "../types/app.types";
import colors from "../theme/colors";

const nodeTypeConfig = {
  datasource: {
    icon: ColumnIcon,
    color: colors.datasource.border, // Using datasource border color
    label: "Data source fields",
  },
  calculation: {
    icon: CalculationIcon,
    color: colors.calculation.border, // Using calculation border color
    label: "Calculated fields",
  },
  parameter: {
    icon: ParameterIcon,
    color: colors.parameter.border, // Using parameter border color
    label: "Parameters",
  },
};

const roleConfig = {
  measure: { color: colors.measure.border },
  dimension: { color: colors.dimension.border },
};

const FieldsList: React.FC = () => {
  const { helpers } = useAppContext();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<NodeType[]>([
    "datasource",
    "calculation",
    "parameter",
  ]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([
    "measure",
    "dimension",
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
      const matchesRole = selectedRoles.includes(node.role);
      return matchesSearch && matchesType && matchesRole;
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

  const handleRoleChange = (
    _event: React.MouseEvent<HTMLElement>,
    newRoles: string[]
  ) => {
    // Ensure at least one role is selected
    if (newRoles.length > 0) {
      setSelectedRoles(newRoles);
    }
  };

  const handleFieldSelect = (node: Node) => {
    navigate(`/field/${encodeURIComponent(node.id)}`);
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
            inputProps={{
              "aria-label": "Search fields",
            }}
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
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 500 }}>
            Types
          </Typography>
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

          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 500 }}>
            Roles
          </Typography>
          <ToggleButtonGroup
            value={selectedRoles}
            onChange={handleRoleChange}
            aria-label="field roles"
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
            {Object.entries(roleConfig).map(([role, config]) => (
              <ToggleButton
                key={role}
                value={role}
                aria-label={role}
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
                <Typography
                  sx={{
                    textTransform: "capitalize",
                    fontSize: "0.875rem",
                  }}
                >
                  {role}
                </Typography>
              </ToggleButton>
            ))}
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
              onClick={() => handleFieldSelect(node)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  handleFieldSelect(node);
                }
              }}
              data-testid="list-item"
              data-node-id={node.id}
              sx={{
                p: 2,
                mb: 1,
                cursor: "pointer",
                backgroundColor: node.id === id ? "primary.main" : "grey.100",
                color: node.id === id ? "primary.contrastText" : "inherit",
                borderRadius: 1,
                "&:hover": {
                  backgroundColor: node.id === id ? "primary.dark" : "grey.200",
                },
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <Icon
                  sx={{
                    color: node.id === id ? "inherit" : config.color,
                    mr: 1,
                    fontSize: "1.2rem",
                  }}
                />
                <Typography>{node.displayName}</Typography>
              </Box>
              <Box sx={{ display: "flex", gap: 1, ml: 3.2 }}>
                <Chip
                  size="small"
                  label={
                    node.type === "datasource"
                      ? "Data source field"
                      : node.type === "calculation"
                      ? "Calculated field"
                      : "Parameter"
                  }
                  sx={{
                    backgroundColor:
                      node.id === id
                        ? "rgba(255, 255, 255, 0.2)"
                        : `${config.color}20`,
                    color: node.id === id ? "inherit" : config.color,
                    fontWeight: 500,
                    fontSize: "0.75rem",
                  }}
                />
                <Chip
                  size="small"
                  label={node.role}
                  sx={{
                    backgroundColor:
                      node.id === id
                        ? "rgba(255, 255, 255, 0.2)"
                        : `${roleConfig[node.role]?.color || "#757575"}20`,
                    color:
                      node.id === id
                        ? "inherit"
                        : roleConfig[node.role]?.color || "#757575",
                    fontWeight: 500,
                    fontSize: "0.75rem",
                    textTransform: "capitalize",
                  }}
                />
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

export default FieldsList;
