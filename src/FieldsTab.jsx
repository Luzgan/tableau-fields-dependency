import React, { useCallback } from "react";
import { Outlet } from "react-router-dom";
import FieldsList from "./FieldsList";
import { Box, Button } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowBackIos } from "@mui/icons-material";
import * as _ from "lodash";

export default function FieldsTab(props) {
  const navigate = useNavigate();
  const goBack = useCallback(() => {
    navigate(-1);
  }, []);
  const { fieldId } = useParams();
  return (
    <Box
      maxWidth="lg"
      component="div"
      sx={{ overflow: "hidden", maxHeight: "100%" }}
      display={"flex"}
    >
      <FieldsList data={props.data} />
      <Box
        maxWidth="lg"
        component="div"
        flexGrow={1}
        maxHeight={"100%"}
        overflow={"scroll"}
        display={"flex"}
        flexDirection={"column"}
      >
        {!_.isNil(fieldId) && (
          <Box sx={{ px: 2, py: 2 }}>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIos />}
              onClick={goBack}
            >
              Go back
            </Button>
          </Box>
        )}
        <Outlet />
      </Box>
    </Box>
  );
}
