const fs = require("fs");
const express = require("express");
const ejs = require("ejs");
const _ = require("lodash");

const app = express();

app.get("/", (req, res) => {
  res.send(
    ejs.render(fs.readFileSync("./index.ejs").toString("utf-8"), {
      bundleUrl: `${process.env.DEV_SERVER_URL}/app.js`,
    })
  );
});
app.listen(3000);
