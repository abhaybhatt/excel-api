const express = require("express");

var bodyParser = require('body-parser')
const app = express();
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

const router = require("./routes/routes.js");
app.use("/", router);

app.listen(1337, (req, res) => console.log("running on 1337"));