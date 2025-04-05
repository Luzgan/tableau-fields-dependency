import { Box, Tab, Tabs, Typography } from "@mui/material";
import React, { useState } from "react";
import { useAppContext } from "./AppContext";
import { Node } from "./types";

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
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    "aria-controls": `simple-tabpanel-${index}`,
  };
}

interface ReferencesListProps {
  node: Node;
}

const ReferencesList: React.FC<ReferencesListProps> = ({ node }) => {
  const [value, setValue] = useState(0);
  const { helpers } = useAppContext();

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  const referencingNodes = helpers.getReferencingNodes(node.id);
  const referencedNodes = helpers.getReferencedNodes(node.id);

  const renderNodeList = (nodes: Node[]) => {
    if (nodes.length === 0) {
      return (
        <Typography color="text.secondary">No references found</Typography>
      );
    }

    return nodes.map((node) => (
      <Box
        key={node.id}
        sx={{
          p: 2,
          mb: 1,
          backgroundColor: "grey.100",
          borderRadius: 1,
        }}
      >
        <Typography>{node.name}</Typography>
        <Typography variant="caption" color="text.secondary">
          {node.type}
        </Typography>
      </Box>
    ));
  };

  return (
    <Box>
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs
          value={value}
          onChange={handleChange}
          aria-label="references tabs"
        >
          <Tab label="Referenced By" {...a11yProps(0)} />
          <Tab label="References" {...a11yProps(1)} />
        </Tabs>
      </Box>
      <TabPanel value={value} index={0}>
        {renderNodeList(referencingNodes)}
      </TabPanel>
      <TabPanel value={value} index={1}>
        {renderNodeList(referencedNodes)}
      </TabPanel>
    </Box>
  );
};

export default ReferencesList;
