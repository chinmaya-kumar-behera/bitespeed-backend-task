const express = require('express');
const { con } = require('../config/dbConfig');
const router = require('./router/router');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

con.connect(function (err) {
  if (err) throw err;
  console.log("Connected to MySQL database !");
});

app.use("/", router);

const PORT = 5000;
app.listen(PORT, () => {
    console.log("App is running on port",PORT)
})