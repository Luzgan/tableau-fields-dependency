import React, { useState, useRef, useCallback } from "react";
import * as _ from "lodash";
import { Button, Container, Typography } from "@mui/material";
import { XMLParser } from "fast-xml-parser";

const parser = new XMLParser({ ignoreAttributes: false, htmlEntities: false });

const getFieldtype = (column) => {
  if (column?.["@_param-domain-type"]) {
    return "parameter";
  }

  if (column?.calculation) {
    return "calculation";
  }

  return "sourcefield";
};

const getIndirectUsedInFields = (row) => {
  const indirectUsedIn = [];
  const listToCheck = [];
  for (const initialUsedField of row.usedIn) {
    listToCheck.push(...initialUsedField.usedIn);
    while (listToCheck.length > 0) {
      const deepUsedIns = listToCheck.pop()?.usedIn ?? [];
      for (const deepUsedIn of deepUsedIns) {
        if (!indirectUsedIn.find((value) => value === deepUsedIn)) {
          listToCheck.push(deepUsedIn);
          indirectUsedIn.push(deepUsedIn);
        }
      }
    }
  }
  return indirectUsedIn;
};

const cleanCalculation = (calculation) => {
  if (!calculation) return calculation;

  const regex = /\/\/.*?&#13;&#10;/gm;
  const subst = ``;

  const result = calculation.replace(regex, subst);
  return result;
};

const onFileChange = async (event, setFilename, setFileData) => {
  setFilename(event.target.files[0].name);
  const data = parser.parse(await event.target.files[0].text());

  const datasources = data.workbook.datasources.datasource;
  const flatStructure = [];

  let i = 0;
  for (const datasource of datasources) {
    const columns = datasource.column;
    for (const column of columns) {
      const columnDefinition = _.omitBy(
        {
          id: `field-${i}`,
          name: column?.["@_name"],
          caption: column?.["@_caption"],
          role: column?.["@_role"],
          type: columns?.["@_type"],
          datatype: column?.["@_datatype"],
          fieldtype: getFieldtype(column),
          calculation: cleanCalculation(column?.calculation?.["@_formula"]),
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
    if (!row.usedIn) {
      row.usedIn = [];
    }
    for (const calculation of calculations) {
      const escapeStringRegexp = (await import("escape-string-regexp")).default;
      const regexp = new RegExp(escapeStringRegexp(row.name));
      if (regexp.test(calculation.calculation)) {
        row.usedIn.push(calculation);
      }
    }
  }

  for (const row of flatStructure) {
    if (row?.usedIn?.length > 0) {
      row.usedInDeep = getIndirectUsedInFields(row);
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

  setFileData(respond);
};

export default function FileUpload(props) {
  const [filename, setFilename] = useState(null);
  const inputRef = useRef(null);
  const onChangeCallback = useCallback(
    (event) => onFileChange(event, setFilename, props.setFileData),
    []
  );

  const onClick = () => {
    inputRef.current.click();
  };

  return (
    <Container
      align="center"
      maxWidth="sm"
      component="div"
      sx={{ pt: 8, pb: 4 }}
    >
      <Typography>{filename ?? "No file selected"}</Typography>
      <Button variant="outlined" onClick={onClick}>
        Upload file
      </Button>
      <input
        style={{ display: "none" }}
        ref={inputRef}
        type="file"
        accept=".twb"
        onChange={onChangeCallback}
      />
    </Container>
  );
}
