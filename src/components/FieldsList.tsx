import {
  Box,
  TextField,
  Typography,
  Tooltip,
  Chip,
  IconButton,
  Popover,
  Badge,
} from "@mui/material";
import {
  TableChart as ColumnIcon,
  Functions as CalculationIcon,
  Tune as ParameterIcon,
  FilterAlt as FilterIcon,
  VisibilityOff as UnusedIcon,
} from "@mui/icons-material";
import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAppContext } from "./AppContext";
import { Node, NodeType } from "../types/app.types";
import colors from "../theme/colors";

const nodeTypeConfig = {
  datasource: {
    icon: ColumnIcon,
    color: colors.datasource.border,
    label: "Data source fields",
  },
  calculation: {
    icon: CalculationIcon,
    color: colors.calculation.border,
    label: "Calculated fields",
  },
  parameter: {
    icon: ParameterIcon,
    color: colors.parameter.border,
    label: "Parameters",
  },
};

const roleConfig = {
  measure: { color: colors.measure.border },
  dimension: { color: colors.dimension.border },
};

const allTypes: NodeType[] = ["datasource", "calculation", "parameter"];
const allRoles = ["measure", "dimension"];

const FieldsList: React.FC = () => {
  const { helpers } = useAppContext();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<NodeType[]>([...allTypes]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([...allRoles]);
  const [showUnusedOnly, setShowUnusedOnly] = useState(false);
  const [filterAnchorEl, setFilterAnchorEl] = useState<HTMLElement | null>(
    null
  );

  const nodes = helpers.getNodes();

  const filtersOpen = Boolean(filterAnchorEl);

  const activeFilterCount =
    (allTypes.length - selectedTypes.length) +
    (allRoles.length - selectedRoles.length) +
    (showUnusedOnly ? 1 : 0);

  const isDefaultFilters = activeFilterCount === 0 && searchTerm === "";

  const filterNodes = (nodes: Node[]): Node[] => {
    return nodes.filter((node) => {
      const matchesSearch =
        node.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        node.caption?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        false;
      const matchesType = selectedTypes.includes(node.type);
      const matchesRole = selectedRoles.includes(node.role);
      const matchesUsage = !showUnusedOnly || !helpers.isFieldUsed(node.id);
      return matchesSearch && matchesType && matchesRole && matchesUsage;
    });
  };

  const toggleType = (type: NodeType): void => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const toggleRole = (role: string): void => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const handleClearAll = (): void => {
    setSearchTerm("");
    setSelectedTypes([...allTypes]);
    setSelectedRoles([...allRoles]);
    setShowUnusedOnly(false);
  };

  const handleFieldSelect = (node: Node): void => {
    navigate(`/field/${encodeURIComponent(node.id)}`);
  };

  const filteredNodes = filterNodes(nodes);

  return (
    <Box
      sx={{ width: "100%", flex: 1, display: "flex", flexDirection: "column" }}
    >
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
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
          <Tooltip title={`${filtersOpen ? "Hide" : "Show"} filters`}>
            <IconButton
              size="small"
              onClick={(e) =>
                setFilterAnchorEl(filtersOpen ? null : e.currentTarget)
              }
              aria-label="Toggle filters"
              sx={{
                width: 40,
                height: 40,
                alignSelf: "center",
                backgroundColor: filtersOpen
                  ? "action.selected"
                  : "transparent",
                "&:hover": {
                  backgroundColor: filtersOpen
                    ? "action.selected"
                    : "action.hover",
                },
              }}
            >
              <Badge
                badgeContent={activeFilterCount}
                color="primary"
                sx={{
                  "& .MuiBadge-badge": {
                    fontSize: "0.65rem",
                    height: 16,
                    minWidth: 16,
                  },
                }}
              >
                <FilterIcon />
              </Badge>
            </IconButton>
          </Tooltip>
        </Box>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography
            variant="caption"
            sx={{ color: "text.secondary" }}
            aria-live="polite"
          >
            {filteredNodes.length === nodes.length
              ? `${nodes.length} fields`
              : `${filteredNodes.length} of ${nodes.length} fields`}
          </Typography>
          {!isDefaultFilters && (
            <Typography
              variant="caption"
              onClick={handleClearAll}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") handleClearAll();
              }}
              sx={{
                color: "primary.main",
                cursor: "pointer",
                "&:hover": { textDecoration: "underline" },
              }}
            >
              Clear all
            </Typography>
          )}
        </Box>
        <Popover
          open={filtersOpen}
          anchorEl={filterAnchorEl}
          onClose={() => setFilterAnchorEl(null)}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
          slotProps={{
            paper: {
              sx: {
                p: 2,
                mt: 1,
                minWidth: 220,
                borderRadius: 2,
              },
            },
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{ mb: 1, fontWeight: 600, color: "text.secondary" }}
          >
            Types
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, mb: 2 }}>
            {(Object.keys(nodeTypeConfig) as NodeType[]).map((type) => {
              const config = nodeTypeConfig[type];
              const Icon = config.icon;
              const selected = selectedTypes.includes(type);
              return (
                <Chip
                  key={type}
                  icon={<Icon sx={{ fontSize: "1rem" }} />}
                  label={config.label}
                  size="small"
                  onClick={() => toggleType(type)}
                  aria-label={type}
                  aria-pressed={selected}
                  sx={{
                    cursor: "pointer",
                    justifyContent: "flex-start",
                    fontWeight: 500,
                    fontSize: "0.8rem",
                    backgroundColor: selected
                      ? `${config.color}20`
                      : "transparent",
                    color: selected ? config.color : "text.disabled",
                    border: `1px solid ${selected ? config.color : "#e0e0e0"}`,
                    opacity: selected ? 1 : 0.6,
                    "& .MuiChip-icon": {
                      color: selected ? config.color : "text.disabled",
                    },
                    "&:hover": {
                      backgroundColor: `${config.color}15`,
                    },
                  }}
                />
              );
            })}
          </Box>

          <Typography
            variant="subtitle2"
            sx={{ mb: 1, fontWeight: 600, color: "text.secondary" }}
          >
            Roles
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, mb: 2 }}>
            {Object.entries(roleConfig).map(([role, config]) => {
              const selected = selectedRoles.includes(role);
              return (
                <Chip
                  key={role}
                  label={role.charAt(0).toUpperCase() + role.slice(1)}
                  size="small"
                  onClick={() => toggleRole(role)}
                  aria-label={role}
                  aria-pressed={selected}
                  sx={{
                    cursor: "pointer",
                    justifyContent: "flex-start",
                    fontWeight: 500,
                    fontSize: "0.8rem",
                    backgroundColor: selected
                      ? `${config.color}20`
                      : "transparent",
                    color: selected ? config.color : "text.disabled",
                    border: `1px solid ${selected ? config.color : "#e0e0e0"}`,
                    opacity: selected ? 1 : 0.6,
                    "&:hover": {
                      backgroundColor: `${config.color}15`,
                    },
                  }}
                />
              );
            })}
          </Box>

          <Typography
            variant="subtitle2"
            sx={{ mb: 1, fontWeight: 600, color: "text.secondary" }}
          >
            Usage
          </Typography>
          <Chip
            icon={<UnusedIcon sx={{ fontSize: "1rem" }} />}
            label="Unused fields only"
            size="small"
            onClick={() => setShowUnusedOnly((prev) => !prev)}
            aria-label="unused only"
            aria-pressed={showUnusedOnly}
            sx={{
              cursor: "pointer",
              justifyContent: "flex-start",
              fontWeight: 500,
              fontSize: "0.8rem",
              backgroundColor: showUnusedOnly
                ? `${colors.error}20`
                : "transparent",
              color: showUnusedOnly ? colors.error : "text.disabled",
              border: `1px solid ${showUnusedOnly ? colors.error : "#e0e0e0"}`,
              opacity: showUnusedOnly ? 1 : 0.6,
              "& .MuiChip-icon": {
                color: showUnusedOnly ? colors.error : "text.disabled",
              },
              "&:hover": {
                backgroundColor: `${colors.error}15`,
              },
            }}
          />
        </Popover>
      </Box>
      <Box sx={{ flex: 1, overflow: "auto", px: 2 }}>
        {filteredNodes.length === 0 && (
          <Typography
            variant="body2"
            sx={{ textAlign: "center", color: "text.secondary", py: 4 }}
          >
            No fields match the current filters
          </Typography>
        )}
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
                overflow: "hidden",
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
                <Tooltip title={node.displayName} placement="top">
                  <Typography noWrap sx={{ flex: 1, minWidth: 0 }}>
                    {node.displayName}
                  </Typography>
                </Tooltip>
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
