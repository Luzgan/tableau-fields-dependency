import { Box, Tab, Tabs, Typography } from "@mui/material";
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAppContext } from "./AppContext";
import { Node } from "../types/app.types";

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
      id={`references-tabpanel-${index}`}
      aria-labelledby={`references-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box key={`references-content-${index}`} sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `references-tab-${index}`,
    "aria-controls": `references-tabpanel-${index}`,
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

  const directReferencingNodes = helpers.getReferencingNodes(node.id);
  const directReferencedNodes = helpers.getReferencedNodes(node.id);
  const indirectReferencingNodes = helpers.getIndirectReferencingNodes(node.id);
  const indirectReferencedNodes = helpers.getIndirectReferencedNodes(node.id);

  const renderNodeList = (
    directNodes: Node[],
    indirectNodes: Node[],
    isReferencing: boolean
  ) => {
    if (directNodes.length === 0 && indirectNodes.length === 0) {
      return (
        <Typography color="text.secondary">No references found</Typography>
      );
    }

    return (
      <>
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">
            {`Direct references: ${directNodes.length}`}
          </Typography>
          <Typography variant="subtitle2" color="text.secondary">
            {`Indirect references: ${indirectNodes.length}`}
          </Typography>
        </Box>

        {directNodes.map((refNode) => (
          <Box
            key={`${refNode.id}-direct-${
              isReferencing ? "referencing" : "referenced"
            }`}
            component={Link}
            to={`/field/${refNode.id}`}
            state={{ from: "reference" }}
            sx={{
              p: 2,
              mb: 1,
              backgroundColor: "grey.100",
              borderRadius: 1,
              cursor: "pointer",
              textDecoration: "none",
              color: "inherit",
              display: "block",
              "&:hover": {
                backgroundColor: "grey.200",
              },
            }}
            data-testid="reference-link"
            data-node-id={`${refNode.id}-direct-${
              isReferencing ? "referencing" : "referenced"
            }`}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Box>
                <Typography>{refNode.displayName}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {refNode.type}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ ml: 1 }}
                >
                  {isReferencing ? "referencing" : "referenced"}
                </Typography>
              </Box>
              <Typography
                variant="caption"
                sx={{
                  color: "success.main",
                  fontWeight: "bold",
                }}
              >
                DIRECT
              </Typography>
            </Box>
          </Box>
        ))}

        {indirectNodes.map((refNode) => (
          <Box
            key={`${refNode.id}-indirect-${
              isReferencing ? "referencing" : "referenced"
            }`}
            component={Link}
            to={`/field/${refNode.id}`}
            state={{ from: "reference" }}
            sx={{
              p: 2,
              mb: 1,
              backgroundColor: "grey.50",
              borderRadius: 1,
              cursor: "pointer",
              textDecoration: "none",
              color: "inherit",
              display: "block",
              "&:hover": {
                backgroundColor: "grey.100",
              },
            }}
            data-testid="reference-link"
            data-node-id={`${refNode.id}-indirect-${
              isReferencing ? "referencing" : "referenced"
            }`}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Box>
                <Typography>{refNode.displayName}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {refNode.type}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ ml: 1 }}
                >
                  {isReferencing ? "referencing" : "referenced"}
                </Typography>
              </Box>
              <Typography
                variant="caption"
                sx={{
                  color: "warning.main",
                  fontWeight: "bold",
                }}
              >
                INDIRECT
              </Typography>
            </Box>
          </Box>
        ))}
      </>
    );
  };

  return (
    <Box>
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs
          value={value}
          onChange={handleChange}
          aria-label="references tabs"
        >
          <Tab
            label={`Referenced By (${
              directReferencingNodes.length + indirectReferencingNodes.length
            })`}
            {...a11yProps(0)}
          />
          <Tab
            label={`References (${
              directReferencedNodes.length + indirectReferencedNodes.length
            })`}
            {...a11yProps(1)}
          />
        </Tabs>
      </Box>
      <TabPanel value={value} index={0}>
        {renderNodeList(directReferencingNodes, indirectReferencingNodes, true)}
      </TabPanel>
      <TabPanel value={value} index={1}>
        {renderNodeList(directReferencedNodes, indirectReferencedNodes, false)}
      </TabPanel>
    </Box>
  );
};

export default ReferencesList;
