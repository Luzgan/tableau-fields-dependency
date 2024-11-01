import React, { useState, useCallback } from "react";
import FieldsTab from "./FieldsTab";
import { Box, Tabs, Tab, Container } from "@mui/material";

function CustomTabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && children}
    </div>
  );
}

const a11yProps = (index) => {
  return {
    id: `simple-tab-${index}`,
    "aria-controls": `simple-tabpanel-${index}`,
  };
};

export default function Data(props) {
  const [selectedTab, setSelectedTab] = useState(0);
  const handleChange = useCallback((event, value) => {
    setSelectedTab(value);
  }, []);

  return (
    <Container maxWidth="lg" component="div">
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs
          value={selectedTab}
          onChange={handleChange}
          aria-label="Data explorer tabs"
        >
          <Tab label="Fields" {...a11yProps(0)} />
        </Tabs>
      </Box>
      <CustomTabPanel value={selectedTab} index={0}>
        <FieldsTab data={props.data} />
      </CustomTabPanel>
    </Container>
  );
}
