import { AppBar, Box, Container, Tab, Tabs } from "@mui/material";
import React, { useState } from "react";
import Data from "./Data";
import Graph from "./Graph";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <Box
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      sx={{ flex: 1, display: value === index ? "flex" : "none" }}
      {...other}
    >
      {value === index && children}
    </Box>
  );
}

function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    "aria-controls": `simple-tabpanel-${index}`,
  };
}

const Toolbar: React.FC = () => {
  const [value, setValue] = useState(0);

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
      <AppBar position="static" color="default" elevation={0}>
        <Container maxWidth={false} disableGutters>
          <Tabs
            value={value}
            onChange={handleChange}
            aria-label="navigation tabs"
            sx={{
              borderBottom: 1,
              borderColor: "divider",
              backgroundColor: "primary.main",
              "& .MuiTab-root": {
                color: "white",
                "&.Mui-selected": {
                  color: "white",
                },
              },
              "& .MuiTabs-indicator": {
                backgroundColor: "white",
              },
            }}
          >
            <Tab label="Fields" {...a11yProps(0)} />
            <Tab label="Graph" {...a11yProps(1)} />
          </Tabs>
        </Container>
      </AppBar>
      <Box sx={{ flex: 1, display: "flex", overflow: "hidden" }}>
        <TabPanel value={value} index={0}>
          <Container
            maxWidth={false}
            sx={{
              flex: 1,
              display: "flex",
              overflow: "hidden",
              py: 2,
            }}
          >
            <Data />
          </Container>
        </TabPanel>
        <TabPanel value={value} index={1}>
          <Container
            maxWidth={false}
            sx={{
              flex: 1,
              display: "flex",
              overflow: "hidden",
              py: 2,
            }}
          >
            <Graph />
          </Container>
        </TabPanel>
      </Box>
    </Box>
  );
};

export default Toolbar;
