var mysql = require("mysql");
var pool = mysql.createPool({
  connectionLimit: 10,
  host: "classmysql.engr.oregonstate.edu",
  user: "cs340_vereggem",
  password: "5086",
  database: "cs340_vereggem",
  multipleStatements: true,
});

module.exports.pool = pool;
