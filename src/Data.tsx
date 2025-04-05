import React from "react";
import { useAppContext } from "./AppContext";
import FieldsTab from "./FieldsTab";

const Data: React.FC = () => {
  const { fileData } = useAppContext();

  if (!fileData?.nodesById) {
    return null;
  }

  return <FieldsTab />;
};

export default Data;
