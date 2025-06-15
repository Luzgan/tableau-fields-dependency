#!/usr/bin/env node
const express = require("express");
const path = require("path");
const app = express();

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.use("/assets", express.static(path.join(__dirname, "dist/assets")));

// Catch-all route using regex
app.get(/.*/, (req, res) => {
  res.redirect("/");
});

// Handle the Promise returned by listen
const startServer = async () => {
  try {
    const server = await app.listen(3000);
    console.log("App listens on 3000");
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
