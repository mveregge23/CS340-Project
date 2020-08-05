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
  let context = {};
  context.title = "Players";
  mysql.pool.query("SELECT * FROM Players", function (err, result) {
    if (err) {
      context.error = {
        code: err.code,
        sql: err.sql,
        "sql-err": err.sqlMessage,
      };
      res.render("500", context);
      return;
    }
    console.log(result);
    context.results = result;
    res.render("players", context);
  });
});

app.get("/matchdays", function (req, res, next) {
  var context = {
    scripts: ["matchdays.js"],
    title: "Matchdays",
  };
  mysql.pool.query(
    "SELECT teamName, teamId from Teams;\
    SELECT Matchdays.matchdayId, Matchdays.gameDate, t1.teamName, t2.teamName, t1.teamId AS teamId1, t2.teamId AS teamId2 FROM Matchdays\
    JOIN Teams_Matchdays AS tm1 ON Matchdays.matchdayId=tm1.matchday\
    JOIN Teams as t1 ON tm1.team=t1.teamId\
    JOIN Teams_Matchdays as tm2 ON Matchdays.matchdayId=tm2.matchday AND tm1.teamMatchdayId!=tm2.teamMatchdayId\
    JOIN Teams as t2 ON tm2.team=t2.teamId\
    GROUP BY Matchdays.matchdayId;",
    function (err, result) {
      if (err) {
        context.error = {
          code: err.code,
          sql: err.sql,
          "sql-err": err.sqlMessage,
        };
        res.render("500", context);
        return;
      }
      console.log(result);
      context.teams = result[0];
      context.matchdays = result[1];
      context.matchdays.forEach((md) => {
        md.gameDate = moment(md.gameDate).format("yyyy-MM-DDTHH:mm");
        return md;
      });
      res.render("matchdays", context);
    }
  );
});

app.post("/matchdays", function (req, res) {
  let team1 = req.body["team1"];
  let team2 = req.body["team2"];
  let gameDate = req.body["gameDate"];
  const matchdaysInsert = "INSERT INTO Matchdays (gameDate) VALUES (?)";
  mysql.pool.query(matchdaysInsert, [gameDate], function (err, results) {
    let context = {};
    if (err) {
      context.error = {
        code: err.code,
        sql: err.sql,
        "sql-err": err.sqlMessage,
      };
      res.render("500", context);
      return;
    }
    let matchdayId = results.insertId;
    const teamsMatchdaysInsert =
      "INSERT INTO Teams_Matchdays (team, matchday) VALUES (?, ?); INSERT INTO Teams_Matchdays (team, matchday) VALUES (?, ?);";
    mysql.pool.query(
      teamsMatchdaysInsert,
      [team1, matchdayId, team2, matchdayId],
      function (err, results) {
        if (err) {
          context.error = {
            code: err.code,
            sql: err.sql,
            "sql-err": err.sqlMessage,
          };
          res.render("500", context);
          return;
        }
        res.redirect("matchdays");
      }
    );
  });
});

app.put("/matchdays", function (req, res) {
  let values = [];
  for (let val in req.body) {
    values.push(req.body[val] === "" ? null : req.body[val]);
  }
  const updateString =
    "UPDATE Matchdays SET gameDate=?, teamId1=?, teamId2=? WHERE matchdayId=?";
  mysql.pool.query(updateString, values, function (err, results) {
    let context = {};
    if (err) {
      context.error = {
        code: err.code,
        sql: err.sql,
        "sql-err": err.sqlMessage,
      };
      res.render("500", context);
      return;
    }
    res.send("success");
    return;
  });
});

app.delete("/matchdays", function (req, res) {
  let matchdayId = req.body.matchdayId;
  const deleteString = "DELETE FROM Matchdays WHERE matchdayId=?";
  mysql.pool.query(deleteString, [matchdayId], function (err, results) {
    if (err) {
      let context = {};
      context.error = {
        code: err.code,
        sql: err.sql,
        "sql-err": err.sqlMessage,
      };
      res.render("500", context);
      return;
    }
    res.send("success");
  });
});

app.get("/results", function (req, res) {
  let context = {};
  context.title = "Results";
  mysql.pool.query(
    "SELECT matchdayId, gameDate, Teams1.teamName AS team1Name, Teams2.teamName AS team2Name\
     FROM Matchdays JOIN Teams as Teams1 on Matchdays.teamId1 = Teams1.teamId\
     JOIN Teams AS Teams2 ON Matchdays.teamId2 = Teams2.teamId WHERE Matchdays.result IS NULL;",
    function (err, result) {
      if (err) {
        context.error = {
          code: err.code,
          sql: err.sql,
          "sql-err": err.sqlMessage,
        };
        res.render("500", context);
        return;
      }
      result.map((m) => {
        m.gameDate = moment(m.gameDate).format("yyyy-MM-DDTHH:mm");
        return m;
      });
      context.matchdays = result;
      res.render("results", context);
    }
  );
});

app.get("/rosters", function (req, res) {
  var context = {};
  context.title = "Rosters";
  mysql.pool.query("SELECT * FROM Rosters", function (err, result) {
    if (err) {
      context.error = {
        code: err.code,
        sql: err.sql,
        "sql-err": err.sqlMessage,
      };
      res.render("500", context);
      return;
    }
    context.results = result;
    res.render("rosters", context);
  });
});

app.get("/teams", function (req, res, next) {
  let context = {};
  context.title = "Teams";
  mysql.pool.query(
    "SELECT * FROM Teams JOIN Rosters ON Teams.roster=Rosters.rosterId;\
    SELECT rosterId, rosterName FROM Rosters WHERE rosterId NOT IN\
    (SELECT DISTINCT roster FROM Teams)",
    function (err, result) {
      if (err) {
        context.error = {
          code: err.code,
          sql: err.sql,
          "sql-err": err.sqlMessage,
        };
        res.render("500", context);
        return;
      }
      context.teams = result[0];
      context.rosters = result[1];
      console.log(context);
      res.render("teams", context);
    }
  );
});

app.post("/teams", function (req, res) {
  let newTeam = [];
  for (let val in req.body) {
    newTeam.push(req.body[val] === "" ? null : req.body[val]);
  }
  const insertString = "INSERT INTO Teams (teamName, roster) VALUES (?, ?)";
  mysql.pool.query(insertString, newTeam, function (err, results) {
    let context = {};
    if (err) {
      context.error = {
        code: err.code,
        sql: err.sql,
        "sql-err": err.sqlMessage,
      };
      res.render("500", context);
      return;
    }
    res.render("teams");
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
      " press Ctrl-C to terminate."
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
