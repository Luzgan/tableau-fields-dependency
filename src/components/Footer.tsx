import React from "react";
import { Box, Typography, Link } from "@mui/material";
import { Launch } from "@mui/icons-material";

const Footer: React.FC = () => {
  return (
    <Box
      sx={{
        bgcolor: "grey.100",
        borderTop: 1,
        borderColor: "grey.300",
        py: 1,
        px: 2,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 40,
      }}
    >
      <Typography
        variant="body2"
        sx={{
          color: "text.secondary",
          display: "flex",
          alignItems: "center",
          gap: 0.5,
        }}
      >
        Made with ❤️ by{" "}
        <Link
          href="https://lukholc.me"
          target="_blank"
          rel="noopener noreferrer"
          sx={{
            color: "primary.main",
            textDecoration: "none",
            display: "flex",
            alignItems: "center",
            gap: 0.25,
            "&:hover": {
              textDecoration: "underline",
            },
          }}
        >
          Łukasz Holc
          <Launch sx={{ fontSize: "0.875rem" }} />
        </Link>
      </Typography>
    </Box>
  );
};

export default Footer;
