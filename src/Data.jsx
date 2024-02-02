import React from "react";
import DataList from "./DataList";
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

export default class Data extends React.Component {
  state = {
    selectedTab: 0,
  };

  handleChange = (event, value) => {
    this.setState({ selectedTab: value });
  };

  a11yProps = () => (index) => {
    return {
      id: `simple-tab-${index}`,
      "aria-controls": `simple-tabpanel-${index}`,
    };
  };

  render() {
    return (
      <Container maxWidth="lg" component="div">
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs
            value={this.state.selectedTab}
            onChange={this.handleChange}
            aria-label="Data tabs"
          >
            <Tab label="List" {...this.a11yProps(0)} />
            {/* <Tab label="Item Two" {...this.a11yProps(1)} />
            <Tab label="Item Three" {...this.a11yProps(2)} /> */}
          </Tabs>
        </Box>
        <CustomTabPanel value={this.state.selectedTab} index={0}>
          <DataList data={this.props.data} />
        </CustomTabPanel>
        {/* <CustomTabPanel value={this.state.selectedTab} index={1}>
          Item Two
        </CustomTabPanel>
        <CustomTabPanel value={this.state.selectedTab} index={2}>
          Item Three
        </CustomTabPanel> */}
      </Container>
    );
  }
}
