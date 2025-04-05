import React, { createContext, useContext, useState } from "react";
import { Snackbar, Alert, IconButton } from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";

type NotificationType = "success" | "error" | "info" | "warning";

interface NotificationMessage {
  message: string;
  type: NotificationType;
}

interface NotificationContextType {
  showNotification: (message: string, type: NotificationType) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [notification, setNotification] = useState<NotificationMessage | null>(
    null
  );

  const handleClose = () => {
    setNotification(null);
  };

  const showNotification = (message: string, type: NotificationType) => {
    setNotification({ message, type });
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      <Snackbar
        open={!!notification}
        autoHideDuration={5000}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        action={
          <IconButton size="small" color="inherit" onClick={handleClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      >
        <Alert
          onClose={handleClose}
          severity={notification?.type || "success"}
          sx={{ width: "100%" }}
          elevation={6}
          aria-label={`${notification?.type || "success"} notification`}
        >
          {notification?.message || ""}
        </Alert>
      </Snackbar>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotification must be used within a NotificationProvider"
    );
  }
  return context;
};
