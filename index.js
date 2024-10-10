const fs = require("fs");
const express = require("express");
const ejs = require("ejs");
const _ = require("lodash");
const path = require("path");

const app = express();

app.get("/", (req, res) => {
  res.send(
    ejs.render(fs.readFileSync("./index.ejs").toString("utf-8"), {
      bundleUrl: `${process.env.RESOURCES_URL}/app.js`,
    })
  );
});

app.use("/static", express.static(path.join(__dirname, "/dist")));
app.listen(3000);
