import React from "react";
import * as _ from "lodash";
import { Button, Container, Typography } from "@mui/material";
import { XMLParser } from "fast-xml-parser";

const parser = new XMLParser({ ignoreAttributes: false });
export default class FileUpload extends React.Component {
  state = {
    filename: null,
  };
  constructor(props) {
    super(props);
    this.inputRef = React.createRef();
  }

  getFieldtype = (column) => {
    if (column?.["@_param-domain-type"]) {
      return "parameter";
    }

    if (column?.calculation) {
      return "calculation";
    }

    return "sourcefield";
  };

  recurrentListOfFields = (row) => {
    const newUsedInList = [...row.usedIn];
    for (const usedRow of row.usedIn) {
      if (usedRow?.usedIn?.length) {
        newUsedInList.push(...this.recurrentListOfFields(usedRow));
      }
    }
    return newUsedInList;
  };

  onFileChange = async (event) => {
    this.setState({ filename: event.target.files[0].name });
    const data = parser.parse(await event.target.files[0].text());

    const datasources = data.workbook.datasources.datasource;
    const flatStructure = [];

    let i = 0;
    for (const datasource of datasources) {
      const columns = datasource.column;
      for (const column of columns) {
        const columnDefinition = _.omitBy(
          {
            id: i,
            name: column?.["@_name"],
            caption: column?.["@_caption"],
            role: column?.["@_role"],
            type: columns?.["@_type"],
            datatype: column?.["@_datatype"],
            fieldtype: this.getFieldtype(column),
            calculation: column?.calculation?.["@_formula"],
          },
          _.isUndefined
        );
        flatStructure.push(columnDefinition);
        i++;
      }
    }

    const calculations = _.filter(
      flatStructure,
      (row) => row.fieldtype === "calculation"
    );

    for (const row of flatStructure) {
      for (const calculation of calculations) {
        const escapeStringRegexp = (await import("escape-string-regexp"))
          .default;
        const regexp = new RegExp(escapeStringRegexp(row.name));
        if (regexp.test(calculation.calculation)) {
          if (!row.usedIn) {
            row.usedIn = [];
          }
          row.usedIn.push(calculation);
        }
      }
    }

    for (const row of flatStructure) {
      if (row?.usedIn?.length > 0) {
        row.usedInDeep = this.recurrentListOfFields(row);
      }
    }

    const respond = { nodes: [], links: [] };
    for (const row of flatStructure) {
      const nodeToPush = { ...row };

      const linksToPush =
        row?.usedIn?.length > 0
          ? row.usedIn.map((rowUsedIn) => ({
              source: row.id,
              target: rowUsedIn.id,
            }))
          : [];

      respond.nodes.push(nodeToPush);
      respond.links.push(...linksToPush);
    }

    this.props.setFileData(respond);
  };

  onClick = () => {
    this.inputRef.current.click();
  };

  render() {
    return (
      <Container
        align="center"
        maxWidth="sm"
        component="div"
        sx={{ pt: 8, pb: 4 }}
      >
        <Typography>{this.state.filename ?? "No file selected"}</Typography>
        <Button variant="outlined" onClick={this.onClick}>
          Upload file
        </Button>
        <input
          style={{ display: "none" }}
          ref={this.inputRef}
          type="file"
          accept=".twb"
          onChange={this.onFileChange}
        />
      </Container>
    );
  }
}
