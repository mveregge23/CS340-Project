function validateNewMatchday(form) {
  let message;

  const teamId1 = form.team1.value;
  const teamId2 = form.team2.value;
  const gameDate = form.gameDate.value;

  const sameTeams = teamId1 === teamId2 && teamId1 !== "";
  const blankTeam = teamId1 === "" || teamId2 === "";
  const dateBeforeToday = new Date(gameDate) < new Date();

  if (sameTeams) {
    message = "Pick different teams!";
  } else if (blankTeam) {
    message = "Pick two teams!";
  } else if (dateBeforeToday) {
    message = "Pick a date after today!";
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
  const gameDate = matchday.querySelector("input[name='gameDate']").value;

  const sameTeams = teamId1 === teamId2 && teamId1 !== "";
  const blankTeam = teamId1 === "" || teamId2 === "";
  const dateBeforeToday = new Date(gameDate) < new Date();

  if (sameTeams) {
    message = "Pick different teams!";
  } else if (blankTeam) {
    message = "Pick two teams!";
  } else if (dateBeforeToday) {
    message = "Pick a date after today!";
  }

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

function editMatchday(ev) {
  let matchday = ev.target.parentNode.parentNode;
  let inputs = matchday.querySelectorAll("select, input");
  for (let i = 0; i < inputs.length; ++i) {
    inputs[i].disabled = false;
  }
  ev.target.removeEventListener("click", editMatchday);
  ev.target.innerHTML = "Update";
  ev.target.addEventListener("click", updateMatchday);
}

function updateMatchday(ev) {
  let matchday = ev.target.parentNode.parentNode;
  if (!validateExistingMatchday(matchday)) {
    return;
  }
  let inputs = matchday.querySelectorAll("select, input");
  let body = {};
  for (let i = 0; i < inputs.length; ++i) {
    body[inputs[i].name] = inputs[i].value;
  }
  $.ajax({
    type: "PUT",
    url: "updateMatchday",
    contentType: "application/json",
    data: JSON.stringify(body),
  })
    .done(function () {
      for (let i = 0; i < inputs.length; ++i) {
        inputs[i].disabled = true;
      }
      ev.target.removeEventListener("click", updateMatchday);
      ev.target.innerHTML = "Edit";
      ev.target.addEventListener("click", editMatchday);
    })
    .fail(function () {
      alert("Update failed! Try again.");
    });
}

function deleteMatchday(ev) {
  if (
    !confirm(
      "Are you sure you would like to delete this matchday? Any associated results will also be deleted."
    )
  ) {
    return;
  }
  let matchday = ev.target.parentNode.parentNode;
  let matchdayId = matchday.querySelector("input[name='matchdayId']").value;
  $.ajax({
    type: "DELETE",
    url: "deleteMatchday",
    contentType: "application/json",
    data: JSON.stringify({ matchdayId: matchdayId }),
  })
    .done(function () {
      window.location.reload();
    })
    .fail(function () {
      alert("Delete failed! Try again.");
    });
}

let edits = document.querySelectorAll("button[name='editMatchday']");
edits.forEach((edit) => edit.addEventListener("click", editMatchday));

let deletes = document.querySelectorAll("button[name='deleteMatchday']");
deletes.forEach((del) => del.addEventListener("click", deleteMatchday));
