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
import { CalculationNode, Node, Reference } from "../types/app.types";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import Graph from "./Graph";

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

function substituteCalculationDisplayNames(
  calculation: string,
  nodesById: Map<string, Node>,
  references: Reference[]
): string {
  // Create a map of matchedText to displayName for calculation nodes
  const displayNameMap = new Map<string, string>();
  references.forEach((ref) => {
    const targetNode = nodesById.get(ref.targetId);
    if (targetNode && targetNode.type === "calculation") {
      displayNameMap.set(ref.matchedText, targetNode.displayName);
    }
  });
  // Sort keys by length descending to avoid nested replacement issues
  const sortedMatches = Array.from(displayNameMap.keys()).sort(
    (a, b) => b.length - a.length
  );
  let substituted = calculation;
  sortedMatches.forEach((match) => {
    const displayName = displayNameMap.get(match);
    if (displayName) {
      // Replace all occurrences of match with displayName (in brackets)
      substituted = substituted.split(match).join(`[${displayName}]`);
    }
  });
  return substituted;
}

function BasicInfo({ field }: { field: Node }) {
  const { fileData, helpers } = useAppContext();
  const renderCalculationSpecificInfo = (node: CalculationNode) => (
    <>
      <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
        Calculation Properties
      </Typography>
      {/* Show calculation with display names substituted */}
      {fileData && node.calculation && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Calculation (with display names)
          </Typography>
          <Calculation
            calculation={node.calculation}
            nodeId={node.id}
            useDisplayNames={true}
          />
        </Box>
      )}
      {node.calculation && (
        <Calculation calculation={node.calculation} nodeId={node.id} />
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
          {field.type === "datasource"
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
      {field.type === "calculation" &&
        renderCalculationSpecificInfo(field as CalculationNode)}
    </Box>
  );
}

function Calculation({
  calculation,
  nodeId,
  useDisplayNames = false,
}: {
  calculation: string;
  nodeId: string;
  useDisplayNames?: boolean;
}) {
  const { helpers } = useAppContext();
  const references = helpers.getReferencesForNode(nodeId);
  const sourceField = helpers.getNodeById(nodeId);
  const { fileData } = useAppContext();

  // Create a map of matched text to node ID for quick lookup
  const refMap = new Map(
    references.map((ref) => [ref.matchedText, ref.targetId])
  );

  // If using display names, create a map of matched text to display name
  const displayNameMap =
    useDisplayNames && fileData
      ? new Map(
          references.map((ref) => {
            const targetNode = fileData.nodesById.get(ref.targetId);
            return [
              ref.matchedText,
              targetNode?.displayName || ref.matchedText,
            ];
          })
        )
      : undefined;

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

    // Add the link (with display name if requested)
    segments.push({
      type: "link",
      content:
        useDisplayNames && displayNameMap
          ? `[${displayNameMap.get(nextMatch.text) || nextMatch.text}]`
          : nextMatch.text,
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
  const navigate = useNavigate();
  const location = useLocation();

  // Initialize history based on location.state and currentField
  const [history, setHistory] = useState<Node[]>(() => {
    if (!location.state?.from || location.state.from === "list") {
      return [currentField];
    }
    if (location.state.from === "calculation" && location.state.sourceField) {
      return [location.state.sourceField, currentField];
    }
    return [currentField];
  });

  // Append to history on navigation (except for breadcrumb/back)
  useEffect(() => {
    if (
      location.state?.from !== "breadcrumb" &&
      location.state?.from !== "back"
    ) {
      setHistory((prev) => {
        if (prev[prev.length - 1]?.id !== currentField.id) {
          return [...prev, currentField].slice(-5);
        }
        return prev;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentField, location.state?.from]);

  const handleBack = () => {
    if (history.length > 1) {
      setHistory((prev) => {
        const newHistory = prev.slice(0, -1);
        navigate(`/field/${newHistory[newHistory.length - 1].id}`, {
          state: { from: "back" },
        });
        return newHistory;
      });
    }
  };

  const handleBreadcrumbClick =
    (index: number, field: Node) => (e: React.MouseEvent) => {
      e.preventDefault();
      if (index === history.length - 1) {
        // Already at this field, do nothing
        return;
      }
      setHistory((prev) => {
        const newHistory = prev.slice(0, index + 1);
        navigate(`/field/${field.id}`, { state: { from: "breadcrumb" } });
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
          <Tab label="Graph" {...a11yProps(2)} />
        </Tabs>
      </Box>
      <TabPanel value={value} index={0}>
        <BasicInfo field={field} />
      </TabPanel>
      <TabPanel value={value} index={1}>
        <ReferencesList node={field} />
      </TabPanel>
      <TabPanel value={value} index={2}>
        <Box sx={{ height: "60vh", minHeight: 300 }}>
          <Graph nodeId={field.id} />
        </Box>
      </TabPanel>
    </Paper>
  );
};

export default FieldDetails;
