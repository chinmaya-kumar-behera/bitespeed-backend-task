const mysql = require("mysql");

const con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Intr@Psd326",
  database: "bitespeed",
});

module.exports = { con };
