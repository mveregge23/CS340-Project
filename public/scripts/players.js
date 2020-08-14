function changeRoster(ev) {
  let player = ev.target.parentNode.parentNode;
  let roster = player.querySelector("select[name='roster']");
  roster.disabled = false;
  ev.target.innerHTML = "Update Roster";
  ev.target.removeEventListener("click", changeRoster);
  ev.target.addEventListener("click", updateRoster);
  return;
}

function updateRoster(ev) {
  let player = ev.target.parentNode.parentNode;
  let playerId = player.querySelector("input[name='playerId']").value;
  let roster = player.querySelector("select[name='roster']");
  roster.disabled = true;
  let rosterId = roster.value;
  let body = { playerId: playerId, rosterId: rosterId };
  $.ajax({
    type: "PUT",
    url: "players",
    contentType: "application/json",
    data: JSON.stringify(body),
  })
    .done(function () {
      ev.target.removeEventListener("click", updateRoster);
      ev.target.innerHTML = "Edit";
      ev.target.addEventListener("click", changeRoster);
    })
    .fail(function () {
      alert("Update failed! Try again.");
    });
}

let updateRosters = document.querySelectorAll("button[name='updateRoster']");
updateRosters.forEach((roster) => {
  roster.addEventListener("click", changeRoster);
});
