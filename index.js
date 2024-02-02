const fs = require("fs");
const express = require("express");
const ejs = require("ejs");
const _ = require("lodash");

const app = express();
app.get("/api/data", async (req, res) => {
  const parser = new XMLParser({ ignoreAttributes: false });
  let jObj = parser.parse(fs.readFileSync("./test-file.twb", "utf-8"));
  const datasources = jObj.workbook.datasources.datasource;
  const flatStructure = [];

  const getFieldtype = (column) => {
    if (column?.["@_param-domain-type"]) {
      return "parameter";
    }

    if (column?.calculation) {
      return "calculation";
    }

    return "sourcefield";
  };

  const recurrentListOfFields = (row) => {
    const newUsedInList = [...row.usedIn];
    for (const usedRow of row.usedIn) {
      if (usedRow?.usedIn?.length) {
        newUsedInList.push(...recurrentListOfFields(usedRow));
      }
    }
    return newUsedInList;
  };

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
          fieldtype: getFieldtype(column),
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
      const escapeStringRegexp = (await import("escape-string-regexp")).default;
      const regexp = new RegExp(escapeStringRegexp(row.name));
      if (regexp.test(calculation.calculation)) {
        if (!row.usedIn) {
          row.usedIn = [];
        }
        row.usedIn.push(calculation);
      }
    }
  }

  // const simplifiedList = [];
  // for (const row of flatStructure) {
  //     if (row?.usedIn?.length > 0) {
  //         for (const usedIn of row.usedIn) {
  //             const simplifiedRow = {...row};
  //             delete simplifiedRow['usedIn'];

  //             simplifiedRow.dependentFieldName = usedIn.name;
  //             simplifiedRow.dependentFieldCaption = usedIn.caption;
  //             simplifiedList.push({...simplifiedRow});
  //         }
  //     } else {
  //         simplifiedList.push({...row});
  //     }
  // }

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

    if (nodeToPush.usedIn) {
      delete nodeToPush.usedIn;
    }

    respond.nodes.push(nodeToPush);
    respond.links.push(...linksToPush);
  }
  res.send(respond);
});
app.get("/", (req, res) => {
  res.send(
    ejs.render(fs.readFileSync("./index.ejs").toString("utf-8"), {
      bundleUrl: `${process.env.DEV_SERVER_URL}/app.js`,
    })
  );
});
app.listen(3000);
