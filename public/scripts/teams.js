function validateNewTeam(form) {
  const noTeamName = form.team.value == "";
  const noRoster = form.roster.value == "";

  let message;

  if (noTeamName) {
    message = "Enter a name for the team!";
  } else if (noRoster) {
    message = "Select a roster to be associated with the team!";
  }

  if (message) {
    let messageBox = document.querySelector("span[name='message']");
    messageBox.style.color = "red";
    messageBox.innerHTML = message;
    return false;
  }

  return true;
}
