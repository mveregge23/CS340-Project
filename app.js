var express = require("express");
var mysql = require("./dbcon.js");
var moment = require("moment");

var app = express();
var handlebars = require("express-handlebars").create({
  helpers: {
    selected: selected,
    yesOrNo: yesOrNo,
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
  mysql.pool.query(
    "SELECT Teams.teamName, SUM(COALESCE(Teams_Matchdays.goals,0)) AS goals, SUM(COALESCE(Teams_Matchdays.points,0)) AS points\
     FROM Teams_Matchdays JOIN Teams ON Teams_Matchdays.team=Teams.teamId GROUP BY Teams.teamName ORDER BY points DESC, goals DESC;",
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
      context.results = results;
      res.render("index", context);
    }
  );
});

/*--Get rows of players--*/
app.get("/players", function (req, res, next) {
  let context = {};
  context.title = "Players";
  mysql.pool.query(
    "SELECT * FROM Players JOIN Rosters ON Players.roster = Rosters.rosterId; SELECT Rosters.rosterName, Rosters.rosterId FROM Rosters;",
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
      context.players = results[0];
      context.rosters = results[1];
      res.render("players", context);
    }
  );
});

/*--Insert new player to table--*/
app.post("/players", function (req, res) {
  var sql =
    "INSERT INTO Players (firstName, lastName, duesPaid, roster) VALUES (?,?,?,?)";
  var inserts = [
    req.body.firstName,
    req.body.lastName,
    req.body.duesPaid,
    req.body.roster,
  ];
  mysql.pool.query(sql, inserts, function (error, results, field) {
    if (error) {
      res.write(JSON.stringify(error));
      res.end();
    } else {
      res.redirect("/players");
    }
  });
});

/*--Get roster table information--*/
app.get("/rosters", function (req, res) {
  var context = {};
  context.title = "Rosters";
  mysql.pool.query(
    "select Rosters.rosterId, Rosters.rosterName, Rosters.captain, Players.firstName, Players.lastName FROM Rosters JOIN Players on Rosters.captain= Players.playerId ORDER BY Rosters.rosterId",
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
      context.results = result;
      res.render("rosters", context);
    }
  );
});

/*Insert new roster into Rosters Table */
app.post("/rosters", function (req, res) {
  var sql = "INSERT INTO Rosters (rosterName, captain) VALUES (?,?)";
  var inserts = [req.body.rosterName, req.body.captain];
  mysql.pool.query(sql, inserts, function (error, results, field) {
    if (error) {
      res.write(JSON.stringify(error));
      res.end();
    } else {
      res.redirect("/rosters");
    }
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
  let teamId1 = req.body.team1,
    teamId2 = req.body.team2,
    matchdayId = req.body.matchdayId,
    context = {};
  const insertString =
    "INSERT INTO Teams_Matchdays (matchday, team) VALUES (?, ?), (?, ?);";
  mysql.pool.query(
    insertString,
    [matchdayId, teamId1, matchdayId, teamId2],
    function (err, results) {
      if (err) {
        context.error = {
          code: err.code,
          sql: err.sql,
          "sql-err": err.sqlMessage,
        };
        res.render(500, context);
        return;
      }

      res.send("success");
    }
  );
});

app.delete("/matchdays", function (req, res) {
  let matchdayId = req.body.matchdayId;
  let team1 = req.body.team1;
  let team2 = req.body.team2;
  const deleteString =
    "DELETE FROM Teams_Matchdays WHERE matchday=? AND (team=? OR team=?)";
  mysql.pool.query(deleteString, [matchdayId, team1, team2], function (
    err,
    results
  ) {
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
  context.scripts = ["results.js"];
  mysql.pool.query(
    "SELECT Matchdays.gameDate, Matchdays.matchdayId, t1.teamName AS teamName1,\
     tm1.teamMatchdayId as tmId1, t2.teamName as teamName2, tm2.teamMatchdayId as tmId2\
     FROM Matchdays JOIN Teams_Matchdays AS tm1 ON Matchdays.matchdayId=tm1.matchday\
     JOIN Teams AS t1 ON tm1.team=t1.teamId\
     JOIN Teams_Matchdays AS tm2 ON Matchdays.matchdayId=tm2.matchday AND tm2.team!=tm1.team\
     JOIN Teams as t2 ON tm2.team=t2.teamId\
     WHERE tm1.goals IS NULL AND tm2.goals IS NULL\
     GROUP BY Matchdays.matchdayId;\
     SELECT Matchdays.gameDate, t1.teamName AS teamName1,\
     tm1.goals as tmGoals1, t2.teamName as teamName2, tm2.goals as tmGoals2\
     FROM Matchdays JOIN Teams_Matchdays AS tm1 ON Matchdays.matchdayId=tm1.matchday\
     JOIN Teams AS t1 ON tm1.team=t1.teamId\
     JOIN Teams_Matchdays AS tm2 ON Matchdays.matchdayId=tm2.matchday AND tm2.team!=tm1.team\
     JOIN Teams as t2 ON tm2.team=t2.teamId\
     WHERE tm1.goals IS NOT NULL AND tm2.goals IS NOT NULL\
     GROUP BY Matchdays.matchdayId\
     ORDER BY Matchdays.gameDate DESC;",
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
      context.matchdays = results[0];
      context.results = results[1];
      context.matchdays.forEach((m) => {
        m.gameDate = moment(m.gameDate).format("yyyy-MM-DDTHH:mm");
        return m;
      });
      context.results.forEach((r) => {
        r.gameDate = moment(r.gameDate).format("yyyy-MM-DDTHH:mm");
        return r;
      });
      res.render("results", context);
    }
  );
});

app.post("/results", function (req, res) {
  const tmId1 = req.body.tmId1,
    tmId2 = req.body.tmId2,
    team1Goals = req.body.team1Score,
    team2Goals = req.body.team2Score;
  let team1Points, team2Points;
  if (team1Goals > team2Goals) {
    team1Points = 3;
    team2Points = 0;
  } else if (team2Goals > team1Goals) {
    team2Points = 3;
    team1Points = 0;
  } else {
    team1Points = 1;
    team2Points = 1;
  }
  const values = [
    team1Goals,
    team1Points,
    tmId1,
    team2Goals,
    team2Points,
    tmId2,
  ];
  mysql.pool.query(
    "UPDATE Teams_Matchdays SET goals=?, points=? WHERE teamMatchdayId=?;\
   UPDATE Teams_Matchdays SET goals=?, points=? WHERE teamMatchdayId=?;",
    values,
    function (err, results) {
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
      res.redirect("results");
    }
  );
});

app.get("/teams", function (req, res, next) {
  let context = {};
  context.title = "Teams";
  context.scripts = ["teams.js"];
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

function yesOrNo(value) {
  if (value === 1) {
    return "Yes";
  } else if (value === 0) {
    return "No";
  }
}
