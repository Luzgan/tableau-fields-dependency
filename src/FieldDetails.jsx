import React from "react";
import he from "he";
import { useParams, Link } from "react-router-dom";
import { Typography, Grid } from "@mui/material";
import { getFieldName } from "./utils";

function Line({ label, value }) {
  return (
    <Grid
      sx={{ px: 2 }}
      paddingY={1}
      maxWidth={1600}
      container
      spacing={2}
      alignItems="center"
    >
      <Grid item xs={5}>
        <Typography variant="h6">{label}</Typography>
      </Grid>
      <Grid item xs={7}>
        <Typography variant="body1">{value}</Typography>
      </Grid>
    </Grid>
  );
}

function Calculation({ calculation, data }) {
  const replaceWithLinks = (input) => {
    return input.split(/\[([^\]]+)\]/g).map((part, index) => {
      if (index % 2 === 1) {
        const node = data.nodes.find((node) => node.name === `[${part}]`);
        if (!node) {
          return <span key={index}>`[${part}]`</span>;
        }

        const displayName = node.caption ? `[${node.caption}]` : node.name;
        return (
          <Link key={index} to={`/field/${node.id}`}>
            {displayName}
          </Link>
        );
      }
      return part;
    });
  };

  return replaceWithLinks(calculation);
}

export default function FieldDetails({ data }) {
  const { fieldId } = useParams();
  const selectedField = data.nodes.find((node) => node.id === fieldId);

  return (
    <>
      <Line label={"Name:"} value={getFieldName(selectedField)} />
      <Line label={"Field type:"} value={selectedField.fieldtype} />
      <Line label={"Role:"} value={selectedField.role} />
      <Line label={"Data type:"} value={selectedField.datatype} />
      {selectedField.fieldtype === "calculation" ? (
        <Line
          label={"Calculation:"}
          value={
            <Calculation
              calculation={he.decode(selectedField.calculation)}
              data={data}
            />
          }
        />
      ) : null}
      <Line
        label={"No. direct references:"}
        value={
          <Link relative to="./direct">
            {selectedField?.usedIn?.length ?? 0}
          </Link>
        }
      />
      <Line
        label={"No. indirect references:"}
        value={
          <Link relative to="./indirect">
            {selectedField?.usedInDeep?.length ?? 0}
          </Link>
        }
      />
      <Grid
        sx={{ px: 2 }}
        paddingY={1}
        maxWidth={1600}
        container
        spacing={2}
        alignItems="center"
      >
        <Grid item xs={5}>
          <Typography variant="h6">
            <Link relative to="./graph">
              See graph
            </Link>
          </Typography>
        </Grid>
        <Grid item xs={7}></Grid>
      </Grid>
    </>
  );
}
