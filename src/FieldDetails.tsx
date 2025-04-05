import { Box, Paper, Tab, Tabs, Typography } from "@mui/material";
import React, { useState } from "react";
import { useAppContext } from "./AppContext";
import ReferencesList from "./ReferencesList";
import { CalculationNode, ColumnNode, Node, ParameterNode } from "./types";

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
      {node.calculation && <Calculation calculation={node.calculation} />}
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
