#!/usr/bin/env node
const express = require("express");
const path = require("path");
const app = express();

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

app.use("/assets", express.static(path.join(__dirname, "dist/assets")));

app.get("*", (req, res) => {
  res.redirect("/");
});

app.listen(3000, () => {
  console.log("App listens on 3000");
});
