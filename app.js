var express = require("express");
var mysql = require("./dbcon.js");
var moment = require("moment");

var app = express();
var handlebars = require("express-handlebars").create({
  helpers: {
    selected: selected,
  },
  defaultLayout: "main",
});

var bodyParser = require("body-parser");

app.engine("handlebars", handlebars.engine);
app.set("view engine", "handlebars");
app.set("port", 3000);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/index", function (req, res, next) {
  var context = {};
  context.title = "Home";
  res.render("index", context);
});

app.get("/players", function (req, res, next) {
  var context = {};
  context.title = "Players";
  mysql.pool.query("SELECT * FROM Players", function (err, result) {
    if (err) {
      next(err);
      return;
    }
    console.log(result);
    context.results = result;
    res.render("players", context);
  });
});

app.get("/matchdays", function (req, res, next) {
  var context = { scripts: ["matchdays.js"], title: "Matchdays" };
  mysql.pool.query(
    "SELECT Matchdays.matchdayId, Matchdays.gameDate, Teams1.teamName AS teamName1,\
    Teams1.teamId AS teamId1, Teams2.teamName AS teamName2, Teams2.teamId AS teamId2\
    FROM Matchdays JOIN Teams AS Teams1 ON Matchdays.teamId1 = Teams1.teamId JOIN Teams AS Teams2 ON Matchdays.teamId2 = Teams2.teamId",
    function (err, result) {
      if (err) {
        next(err);
      }
      context.matchdays = result;
      context.matchdays.map((m) => {
        m.gameDate = moment(m.gameDate).format("yyyy-MM-DDTHH:mm");
        return m;
      });
      mysql.pool.query("SELECT teamName, teamId FROM Teams", function (
        err,
        result
      ) {
        if (err) {
          next(err);
        }
        context.teams = result;
        res.render("matchdays", context);
      });
    }
  );
});

app.post("/newMatchday", function (req, res) {
  let values = [];
  for (let val in req.body) {
    values.push(req.body[val]);
  }
  const insertString =
    "INSERT INTO Matchdays (teamId1, teamId2, gameDate) VALUES (?, ?, ?)";
  mysql.pool.query(insertString, values, function (err, results) {
    if (err) {
      res.send(err);
      next(err);
      return;
    }
    res.redirect("matchdays");
  });
});

app.put("/updateMatchday", function (req, res) {
  let values = [];
  for (let val in req.body) {
    values.push(req.body[val]);
  }
  const updateString =
    "UPDATE Matchdays SET gameDate=?, teamId1=?, teamId2=? WHERE matchdayId=?";
  mysql.pool.query(updateString, values, function (err, results) {
    if (err) {
      res.send(err);
    }
    res.send("success");
    return;
  });
});

app.get("/results", function (req, res, next) {
  var context = {};
  context.title = "Results";
  mysql.pool.query("SELECT * FROM Results", function (err, result) {
    if (err) {
      next(err);
      return;
    }
    console.log(result);
    context.results = result;
    res.render("results", context);
  });
});

app.get("/rosters", function (req, res, next) {
  var context = {};
  context.title = "Rosters";
  mysql.pool.query("SELECT * FROM Rosters", function (err, result) {
    if (err) {
      next(err);
      return;
    }
    console.log(result);
    context.results = result;
    res.render("rosters", context);
  });
});

app.get("/teams", function (req, res, next) {
  var context = {};
  context.title = "Teams";
  mysql.pool.query("SELECT * FROM Teams", function (err, result) {
    if (err) {
      next(err);
      return;
    }
    console.log(result);
    context.results = result;
    res.render("teams", context);
  });
});

app.get("/delete", function (req, res, next) {
  var context = {};
  mysql.pool.query("DELETE FROM todo WHERE id=?", [req.query.id], function (
    err,
    result
  ) {
    if (err) {
      next(err);
      return;
    }
    context.results = "Deleted " + result.changedRows + " rows.";
    res.render("home", context);
  });
});

///simple-update?id=2&name=The+Task&done=false&due=2015-12-5
app.get("/simple-update", function (req, res, next) {
  var context = {};
  mysql.pool.query(
    "UPDATE todo SET name=?, done=?, due=? WHERE id=? ",
    [req.query.name, req.query.done, req.query.due, req.query.id],
    function (err, result) {
      if (err) {
        next(err);
        return;
      }
      context.results = "Updated " + result.changedRows + " rows.";
      res.render("home", context);
    }
  );
});

///safe-update?id=1&name=The+Task&done=false
app.get("/safe-update", function (req, res, next) {
  var context = {};
  mysql.pool.query("SELECT * FROM todo WHERE id=?", [req.query.id], function (
    err,
    result
  ) {
    if (err) {
      next(err);
      return;
    }
    if (result.length == 1) {
      var curVals = result[0];
      mysql.pool.query(
        "UPDATE todo SET name=?, done=?, due=? WHERE id=? ",
        [
          req.query.name || curVals.name,
          req.query.done || curVals.done,
          req.query.due || curVals.due,
          req.query.id,
        ],
        function (err, result) {
          if (err) {
            next(err);
            return;
          }
          context.results = "Updated " + result.changedRows + " rows.";
          res.render("home", context);
        }
      );
    }
  });
});

app.get("/reset-table", function (req, res, next) {
  var context = {};
  mysql.pool.query("DROP TABLE IF EXISTS todo", function (err) {
    var createString =
      "CREATE TABLE todo(" +
      "id INT PRIMARY KEY AUTO_INCREMENT," +
      "name VARCHAR(255) NOT NULL," +
      "done BOOLEAN," +
      "due DATE)";
    mysql.pool.query(createString, function (err) {
      context.results = "Table reset";
      res.render("home", context);
    });
  });
});

function next(err) {
  app.use(function (req, res) {
    res.status(500);
    context = {};
    context.error = { code: err.code, sql: err.sql, "sql-err": err.sqlMessage };
    res.render("500", context);
  });
}

app.use(function (req, res) {
  res.status(404);
  res.render("404");
});

app.use(function (err, req, res, next) {
  console.error(err.stack);
  res.status(500);
  res.render("500");
});

app.listen(app.get("port"), function () {
  console.log(
    "Express started on http://localhost:" +
      app.get("port") +
      "; press Ctrl-C to terminate."
  );
});

//Handlebars helpers
function selected(option, value) {
  if (option === value) {
    return " selected";
  } else {
    return "";
  }
}
