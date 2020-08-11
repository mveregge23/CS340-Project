function validateNewMatchday(form) {
  let message;

  const teamId1 = form.team1.value;
  const teamId2 = form.team2.value;
  const gameDate = form.gameDate.value;

  const sameTeams = teamId1 === teamId2 && teamId1 !== "";
  const blankTeam = teamId1 === "" || teamId2 === "";
  const blankDate = gameDate === "";
  const dateBeforeToday = new Date(gameDate) < new Date();

  if (sameTeams) {
    message = "Pick different teams!";
  } else if (blankTeam) {
    message = "Pick two teams!";
  } else if (dateBeforeToday) {
    message = "Pick a date after today!";
  } else if (blankDate) {
    message = "Pick a date!";
  }

  let messageBox = form.querySelector("span[name='message']");

  if (message) {
    messageBox.style.color = "red";
    messageBox.innerHTML = message;
    return false;
  } else {
    messageBox = "";
    return true;
  }
}

function validateExistingMatchday(matchday) {
  let message;

  const teamId1 = matchday.querySelector("select[name='team1']").value;
  const teamId2 = matchday.querySelector("select[name='team2']").value;

  const sameTeams = teamId1 === teamId2 && teamId1 !== "";
  const blankTeam = teamId1 === "" || teamId2 === "";

  if (sameTeams) {
    message = "Pick different teams!";
  } else if (blankTeam) {
    message = "Pick two teams!";

    let messageBox = matchday.querySelector("span[name='message']");

    if (message) {
      messageBox.style.color = "red";
      messageBox.innerHTML = message;
      return false;
    } else {
      messageBox.innerHTML = "";
      return true;
    }
  }
}

function changeTeams(ev) {
  if (
    !confirm(
      "Are you sure you want to change the teams? Any associated results will be deleted, even if the teams stay the same."
    )
  ) {
    return;
  }
  let matchday = ev.target.parentNode.parentNode;
  let matchdayId = matchday.querySelector("input[name='matchdayId']").value;
  let teams = matchday.querySelectorAll("select");
  let body = { matchdayId: matchdayId };
  for (let i = 0; i < teams.length; ++i) {
    teams[i].disabled = false;
    body[teams[i].name] = teams[i].value;
  }
  $.ajax({
    type: "DELETE",
    url: "matchdays",
    contentType: "application/json",
    data: JSON.stringify(body),
  })
    .done(function () {
      ev.target.removeEventListener("click", changeTeams);
      ev.target.innerHTML = "Update Teams";
      ev.target.addEventListener("click", updateTeams);
    })
    .fail(function () {
      alert("Change teams failed!");
    });
}

function updateTeams(ev) {
  let matchday = ev.target.parentNode.parentNode;
  let matchdayId = matchday.querySelector("input[name='matchdayId']").value;
  if (!validateExistingMatchday(matchday)) {
    return;
  }
  let teams = matchday.querySelectorAll("select");
  let body = { matchdayId: matchdayId };
  for (let i = 0; i < teams.length; ++i) {
    body[teams[i].name] = teams[i].value;
  }
  $.ajax({
    type: "PUT",
    url: "matchdays",
    contentType: "application/json",
    data: JSON.stringify(body),
  })
    .done(function () {
      for (let i = 0; i < teams.length; ++i) {
        teams[i].disabled = true;
      }
      ev.target.removeEventListener("click", updateTeams);
      ev.target.innerHTML = "Change Teams";
      ev.target.addEventListener("click", changeTeams);
    })
    .fail(function () {
      alert("Update failed! Try again.");
    });
}

let changes = document.querySelectorAll("button[name='changeTeams']");
changes.forEach((change) => {
  change.addEventListener("click", changeTeams);
});
