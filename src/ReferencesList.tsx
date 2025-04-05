import { Box, Tab, Tabs, Typography } from "@mui/material";
import React, { useState } from "react";
import { useAppContext } from "./AppContext";
import { Node, Reference } from "./types";

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
  const { helpers, fileData } = useAppContext();

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  const referencingNodes = helpers.getReferencingNodes(node.id);
  const referencedNodes = helpers.getReferencedNodes(node.id);

  const getReferenceCounts = (
    references: Reference[],
    nodeId: string,
    isSource: boolean
  ) => {
    return references.reduce(
      (acc, ref) => {
        if (
          (isSource && ref.targetId === nodeId) ||
          (!isSource && ref.sourceId === nodeId)
        ) {
          acc[ref.type]++;
        }
        return acc;
      },
      { direct: 0, indirect: 0 }
    );
  };

  const getReferenceType = (
    references: Reference[] | undefined,
    sourceId: string,
    targetId: string
  ): "direct" | "indirect" | "unknown" => {
    if (!references) return "unknown";
    const ref = references.find(
      (r) => r.sourceId === sourceId && r.targetId === targetId
    );
    return ref?.type || "unknown";
  };

  const referencingCounts = getReferenceCounts(
    fileData?.references || [],
    node.id,
    false
  );
  const referencedCounts = getReferenceCounts(
    fileData?.references || [],
    node.id,
    true
  );

  const renderNodeList = (nodes: Node[], isReferencing: boolean) => {
    if (nodes.length === 0) {
      return (
        <Typography color="text.secondary">No references found</Typography>
      );
    }

    const counts = isReferencing ? referencingCounts : referencedCounts;

    return (
      <>
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">
            {`Direct references: ${counts.direct}`}
          </Typography>
          <Typography variant="subtitle2" color="text.secondary">
            {`Indirect references: ${counts.indirect}`}
          </Typography>
        </Box>

        {nodes.map((refNode) => {
          const refType = getReferenceType(
            fileData?.references,
            isReferencing ? refNode.id : node.id,
            isReferencing ? node.id : refNode.id
          );

          return (
            <Box
              key={refNode.id}
              sx={{
                p: 2,
                mb: 1,
                backgroundColor: "grey.100",
                borderRadius: 1,
              }}
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
                </Box>
                <Typography
                  variant="caption"
                  sx={{
                    color:
                      refType === "direct" ? "success.main" : "warning.main",
                    fontWeight: "bold",
                  }}
                >
                  {refType.toUpperCase()}
                </Typography>
              </Box>
            </Box>
          );
        })}
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
            label={`Referenced By (${referencingNodes.length})`}
            {...a11yProps(0)}
          />
          <Tab
            label={`References (${referencedNodes.length})`}
            {...a11yProps(1)}
          />
        </Tabs>
      </Box>
      <TabPanel value={value} index={0}>
        {renderNodeList(referencingNodes, true)}
      </TabPanel>
      <TabPanel value={value} index={1}>
        {renderNodeList(referencedNodes, false)}
      </TabPanel>
    </Box>
  );
};

export default ReferencesList;
