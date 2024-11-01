import React from "react";
import { List, ListItem } from "@mui/material";
import { Link, useParams } from "react-router-dom";
import { getFieldName } from "./utils";

export default function ReferencesList(props) {
  const { fieldId } = useParams();
  const selectedField = props.data.nodes.find((node) => node.id === fieldId);
  const referencesList = props.indirect
    ? selectedField.usedInDeep
    : selectedField.usedIn;

  return (
    <List component="nav" aria-label="Direct field">
      {referencesList.map((referencedField) => (
        <ListItem key={referencedField.id}>
          <Link to={`/field/${referencedField.id}`}>
            {getFieldName(referencedField)}
          </Link>
        </ListItem>
      ))}
    </List>
  );
}
