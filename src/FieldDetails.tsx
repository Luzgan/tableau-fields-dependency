import { Box, Paper, Tab, Tabs, Typography } from "@mui/material";
import React, { useState } from "react";
import { useAppContext } from "./AppContext";
import ReferencesList from "./ReferencesList";
import { CalculationNode, ColumnNode, Node } from "./types";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

interface FieldDetailsProps {
  field: Node;
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
      {node.role && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Role
          </Typography>
          <Typography>{node.role}</Typography>
        </Box>
      )}
      {node.aggregation && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Aggregation
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
    </>
  );

  const renderCalculationSpecificInfo = (node: CalculationNode) => (
    <>{node.calculation && <Calculation calculation={node.calculation} />}</>
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
          <Typography>{field.name}</Typography>
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
        <Typography>{field.type}</Typography>
      </Box>
      {field.dataType && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Data Type
          </Typography>
          <Typography>{field.dataType}</Typography>
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
      {field.type === "calculation" && (field as CalculationNode).formula && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Formula
          </Typography>
          <Typography>{(field as CalculationNode).formula}</Typography>
        </Box>
      )}
      {field.type === "column" && renderColumnSpecificInfo(field as ColumnNode)}
      {field.type === "calculation" &&
        renderCalculationSpecificInfo(field as CalculationNode)}
    </Box>
  );
}

function Calculation({ calculation }: { calculation: string }) {
  const { fileData } = useAppContext();

  const replaceWithLinks = (text: string) => {
    const regex = /\[(.*?)\]/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      const fieldName = match[1];
      const nodes = Array.from(fileData?.nodesById?.values() || []) as Node[];
      const node = nodes.find((n) => n.name === fieldName);

      if (lastIndex !== match.index) {
        parts.push(text.slice(lastIndex, match.index));
      }

      if (node) {
        parts.push(
          <Box
            key={match.index}
            component="span"
            sx={{
              color: "primary.main",
              cursor: "pointer",
              textDecoration: "underline",
              "&:hover": {
                color: "primary.dark",
              },
            }}
          >
            {match[0]}
          </Box>
        );
      } else {
        parts.push(match[0]);
      }

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts;
  };

  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle2" color="text.secondary">
        Calculation
      </Typography>
      <Box
        sx={{
          p: 2,
          backgroundColor: "grey.100",
          borderRadius: 1,
          fontFamily: "monospace",
          whiteSpace: "pre-wrap",
        }}
      >
        {replaceWithLinks(calculation)}
      </Box>
    </Box>
  );
}

const FieldDetails: React.FC<FieldDetailsProps> = ({ field }) => {
  const [value, setValue] = useState(0);

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Paper>
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
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
