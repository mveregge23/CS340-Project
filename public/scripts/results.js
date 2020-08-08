$("#matchday").change(function (ev) {
  let selectedMatchday = $(this).children("option:selected");
  let tmId1 = selectedMatchday.attr("tmId1"),
    tmId2 = selectedMatchday.attr("tmId2");
  $("#tmId1").val(tmId1);
  $("#tmId2").val(tmId2);
});

function validateNewResults(form) {
  const team1Goals = form.team1Score.value,
    team2Goals = form.team2Score.value,
    matchday = form.matchday.value,
    goalsAreInvalid =
      team1Goals < 0 || team2Goals < 0 || team1Goals == "" || team2Goals == "",
    matchdayIsInvalid = matchday == "";
  let message,
    messageBox = form.querySelector("span[name='message']");
  messageBox.style.color = "red";
  if (matchdayIsInvalid) {
    message = "Select a matchday!";
    messageBox.innerHTML = message;
    return false;
  } else if (goalsAreInvalid) {
    message = "Score must be greater than or equal to 0!";
    messageBox.innerHTML = message;
    return false;
  } else {
    return true;
  }
}
