import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  Chip,
} from "@mui/material";
import React from "react";
import { ChangelogEntry, changelogData } from "../data/changelog";

interface ChangelogProps {
  open: boolean;
  onClose: () => void;
}

const Changelog: React.FC<ChangelogProps> = ({ open, onClose }) => {
  const getTypeColor = (type: ChangelogEntry["type"]) => {
    switch (type) {
      case "feature":
        return "primary";
      case "fix":
        return "error";
      case "improvement":
        return "success";
      default:
        return "default";
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          minHeight: "60vh",
          maxHeight: "80vh",
        },
      }}
    >
      <DialogTitle>
        <Typography variant="h6">Changelog</Typography>
      </DialogTitle>
      <DialogContent dividers>
        <List>
          {changelogData.map((entry, index) => (
            <ListItem
              key={index}
              alignItems="flex-start"
              sx={{
                flexDirection: "column",
                mb: 2,
                pb: 2,
                borderBottom: index < changelogData.length - 1 ? 1 : 0,
                borderColor: "divider",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  mb: 1,
                }}
              >
                <Typography variant="h6" component="span">
                  v{entry.version}
                </Typography>
                <Chip
                  label={entry.type}
                  size="small"
                  color={getTypeColor(entry.type)}
                />
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ ml: "auto" }}
                >
                  {entry.date}
                </Typography>
              </Box>
              <List dense>
                {entry.changes.map((change, changeIndex) => (
                  <ListItem key={changeIndex}>
                    <ListItemText primary={change} />
                  </ListItem>
                ))}
              </List>
            </ListItem>
          ))}
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default Changelog;
