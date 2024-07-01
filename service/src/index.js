const express = require('express');
const { con } = require('../config/dbConfig');

con.connect(function (err) {
  if (err) throw err;
  console.log("Connected to MySQL database !");
});

const app = express();

const PORT = 5000
app.listen(PORT, () => {
    console.log("App is running on port",PORT)
})