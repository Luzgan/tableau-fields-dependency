import {
  Box,
  Paper,
  Tab,
  Tabs,
  Typography,
  IconButton,
  Breadcrumbs,
} from "@mui/material";
import React, { useState, useEffect } from "react";
import {
  useParams,
  Navigate,
  Link,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { useAppContext } from "./AppContext";
import ReferencesList from "./ReferencesList";
import {
  CalculationNode,
  ColumnNode,
  Node,
  ParameterNode,
} from "../types/app.types";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`field-details-tabpanel-${index}`}
      aria-labelledby={`field-details-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box key={`field-details-content-${index}`} sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `field-details-tab-${index}`,
    "aria-controls": `field-details-tabpanel-${index}`,
  };
}

function BasicInfo({ field }: { field: Node }) {
  const renderColumnSpecificInfo = (node: ColumnNode) => (
    <>
      <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
        Data Source Properties
      </Typography>
      {node.aggregation && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Default Aggregation
          </Typography>
          <Typography>{node.aggregation}</Typography>
        </Box>
      )}
      {node.defaultFormat && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Default Format
          </Typography>
          <Typography>{node.defaultFormat}</Typography>
        </Box>
      )}
      {node.precision !== undefined && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Precision
          </Typography>
          <Typography>{node.precision}</Typography>
        </Box>
      )}
      {node.containsNull !== undefined && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Can Contain Null Values
          </Typography>
          <Typography>{node.containsNull ? "Yes" : "No"}</Typography>
        </Box>
      )}
      {(node.remoteAlias || node.remoteName || node.remoteType) && (
        <>
          <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
            Remote Source Details
          </Typography>
          {node.remoteAlias && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Remote Alias
              </Typography>
              <Typography>{node.remoteAlias}</Typography>
            </Box>
          )}
          {node.remoteName && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Remote Name
              </Typography>
              <Typography>{node.remoteName}</Typography>
            </Box>
          )}
          {node.remoteType && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary">
                Remote Type
              </Typography>
              <Typography>{node.remoteType}</Typography>
            </Box>
          )}
        </>
      )}
    </>
  );

  const renderParameterSpecificInfo = (node: ParameterNode) => (
    <>
      <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
        Parameter Properties
      </Typography>
      {node.paramDomainType && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Domain Type
          </Typography>
          <Typography sx={{ textTransform: "capitalize" }}>
            {node.paramDomainType}
          </Typography>
        </Box>
      )}
      {node.members && node.members.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Allowed Values
          </Typography>
          <Box sx={{ pl: 2 }}>
            {node.members.map(
              (member: { value: string; alias?: string }, index: number) => (
                <Box key={index} sx={{ mb: 0.5 }}>
                  <Typography>
                    {member.alias
                      ? `${member.alias} (${member.value})`
                      : member.value}
                  </Typography>
                </Box>
              )
            )}
          </Box>
        </Box>
      )}
    </>
  );

  const renderCalculationSpecificInfo = (node: CalculationNode) => (
    <>
      <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
        Calculation Properties
      </Typography>
      {node.calculation && (
        <Calculation calculation={node.calculation} nodeId={node.id} />
      )}
      {node.paramDomainType && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Domain Type
          </Typography>
          <Typography sx={{ textTransform: "capitalize" }}>
            {node.paramDomainType}
          </Typography>
        </Box>
      )}
      {node.members && node.members.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Members
          </Typography>
          <Box sx={{ pl: 2 }}>
            {node.members.map((member, index) => (
              <Box key={index} sx={{ mb: 0.5 }}>
                <Typography>
                  {node.aliases?.[member]
                    ? `${node.aliases[member]} (${member})`
                    : member}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </>
  );

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Basic Information
      </Typography>
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" color="text.secondary">
          Name
        </Typography>
        <Typography>{field.displayName}</Typography>
      </Box>
      {field.name !== field.displayName && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Internal Name
          </Typography>
          <Typography
            sx={{
              fontFamily: "monospace",
              backgroundColor: "grey.100",
              px: 1,
              py: 0.5,
              borderRadius: 0.5,
              display: "inline-block",
            }}
          >
            {field.name}
          </Typography>
        </Box>
      )}
      {field.caption && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Caption
          </Typography>
          <Typography>{field.caption}</Typography>
        </Box>
      )}
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" color="text.secondary">
          Type
        </Typography>
        <Typography>
          {field.type === "column"
            ? "Data source field"
            : field.type === "calculation"
            ? "Calculated field"
            : "Parameter"}
        </Typography>
      </Box>
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" color="text.secondary">
          Role
        </Typography>
        <Typography sx={{ textTransform: "capitalize" }}>
          {field.role}
        </Typography>
      </Box>
      {field.dataType && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Data Type
          </Typography>
          <Typography sx={{ textTransform: "capitalize" }}>
            {field.dataType}
          </Typography>
        </Box>
      )}
      {field.description && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Description
          </Typography>
          <Typography>{field.description}</Typography>
        </Box>
      )}
      {field.type === "column" && renderColumnSpecificInfo(field as ColumnNode)}
      {field.type === "parameter" &&
        renderParameterSpecificInfo(field as ParameterNode)}
      {field.type === "calculation" &&
        renderCalculationSpecificInfo(field as CalculationNode)}
    </Box>
  );
}

function Calculation({
  calculation,
  nodeId,
}: {
  calculation: string;
  nodeId: string;
}) {
  const { helpers } = useAppContext();
  const references = helpers.getReferencesForNode(nodeId);
  const sourceField = helpers.getNodeById(nodeId);

  // Create a map of matched text to node ID for quick lookup
  const refMap = new Map(
    references.map((ref) => [ref.matchedText, ref.targetId])
  );

  // Sort references by length in descending order to handle nested references correctly
  const sortedMatches = Array.from(refMap.keys()).sort(
    (a, b) => b.length - a.length
  );

  // Split calculation into segments (text and links)
  const segments: {
    type: "text" | "link";
    content: string;
    targetId?: string;
  }[] = [];
  let remainingText = calculation;
  let lastIndex = 0;

  while (lastIndex < remainingText.length) {
    let nextMatch: { text: string; index: number; targetId: string } | null =
      null;

    // Find the next earliest match
    for (const match of sortedMatches) {
      const index = remainingText.indexOf(match, lastIndex);
      if (index !== -1 && (!nextMatch || index < nextMatch.index)) {
        const targetId = refMap.get(match);
        if (targetId) {
          nextMatch = { text: match, index, targetId };
        }
      }
    }

    if (!nextMatch) {
      // No more matches, add the remaining text
      segments.push({
        type: "text",
        content: remainingText.slice(lastIndex),
      });
      break;
    }

    // Add text before the match
    if (nextMatch.index > lastIndex) {
      segments.push({
        type: "text",
        content: remainingText.slice(lastIndex, nextMatch.index),
      });
    }

    // Add the link
    segments.push({
      type: "link",
      content: nextMatch.text,
      targetId: nextMatch.targetId,
    });

    lastIndex = nextMatch.index + nextMatch.text.length;
  }

  return (
    <Box
      component="pre"
      sx={{
        p: 2,
        backgroundColor: "grey.100",
        borderRadius: 1,
        overflow: "auto",
        fontSize: "0.875rem",
        fontFamily: "monospace",
        "& a": {
          color: "primary.main",
          textDecoration: "none",
          "&:hover": {
            textDecoration: "underline",
          },
        },
      }}
    >
      {segments.map((segment, index) =>
        segment.type === "link" ? (
          <Link
            key={index}
            to={`/field/${segment.targetId}`}
            style={{
              color: "#1976d2",
              textDecoration: "none",
            }}
            state={{ from: "calculation", sourceField }}
            data-testid="reference-link"
            data-node-id={segment.targetId}
          >
            {segment.content}
          </Link>
        ) : (
          <React.Fragment key={index}>{segment.content}</React.Fragment>
        )
      )}
    </Box>
  );
}

// Add this new component for the navigation history
function FieldNavigationHistory({ currentField }: { currentField: Node }) {
  const [history, setHistory] = useState<Node[]>([]);
  const navigate = useNavigate();
  const location = useLocation();

  // Update history when field changes
  useEffect(() => {
    setHistory((prev) => {
      // Don't add if it's the same as the last entry
      if (prev[prev.length - 1]?.id === currentField.id) {
        return prev;
      }

      // If coming from list, start fresh
      if (!location.state?.from || location.state.from === "list") {
        return [currentField];
      }

      // If this is the first calculation click and history is empty,
      // we need to include both the source field and the target field
      if (location.state.from === "calculation" && prev.length === 0) {
        const sourceField = location.state.sourceField;
        return sourceField ? [sourceField, currentField] : [currentField];
      }

      // For all other cases, add to history
      const newHistory = [...prev, currentField].slice(-5);
      return newHistory;
    });
  }, [currentField, location.state?.from]);

  const handleBack = () => {
    if (history.length > 1) {
      // Remove current field and navigate to previous
      setHistory((prev) => {
        const newHistory = prev.slice(0, -1);
        navigate(`/field/${newHistory[newHistory.length - 1].id}`);
        return newHistory;
      });
    }
  };

  const handleBreadcrumbClick =
    (index: number, field: Node) => (e: React.MouseEvent) => {
      e.preventDefault();
      // Trim history up to clicked item
      setHistory((prev) => {
        const newHistory = prev.slice(0, index + 1);
        navigate(`/field/${field.id}`);
        return newHistory;
      });
    };

  return (
    <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
      <IconButton
        onClick={handleBack}
        sx={{ mr: 1 }}
        aria-label="go back"
        data-testid="back-button"
        disabled={history.length <= 1}
      >
        <ArrowBackIcon />
      </IconButton>
      <Breadcrumbs
        separator={<NavigateNextIcon fontSize="small" />}
        aria-label="field navigation history"
        data-testid="field-history"
      >
        {history.map((field, index) => {
          const isLast = index === history.length - 1;
          return (
            <Link
              key={`${field.id}-${index}`}
              to={`/field/${field.id}`}
              onClick={handleBreadcrumbClick(index, field)}
              data-testid={`history-item-${index}`}
              state={{ from: "breadcrumb" }}
              style={{
                color: isLast ? "#1976d2" : "#666",
                textDecoration: "none",
                fontWeight: isLast ? 600 : 400,
              }}
            >
              {field.displayName}
            </Link>
          );
        })}
      </Breadcrumbs>
    </Box>
  );
}

const FieldDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { helpers } = useAppContext();
  const [value, setValue] = useState(0);
  const location = useLocation();

  const field = id ? helpers.getNodeById(id) : null;

  if (!field) {
    return <Navigate to="/" replace />;
  }

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  // Use state.from to detect if navigation came from the list
  const isFromList = !location.state?.from || location.state.from === "list";

  return (
    <Paper>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
        <FieldNavigationHistory
          currentField={field}
          key={isFromList ? field.id : undefined}
        />
        <Tabs
          value={value}
          onChange={handleChange}
          aria-label="field details tabs"
        >
          <Tab label="Basic Info" {...a11yProps(0)} />
          <Tab label="References" {...a11yProps(1)} />
        </Tabs>
      </Box>
      <TabPanel value={value} index={0}>
        <BasicInfo field={field} />
      </TabPanel>
      <TabPanel value={value} index={1}>
        <ReferencesList node={field} />
      </TabPanel>
    </Paper>
  );
};

export default FieldDetails;
