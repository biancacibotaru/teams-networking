import { loadTeamsRequest, createTeamRequest, updateTeamRequest, deleteTeamRequest } from "./middleware";
import "./style.css";
import { $, $$, debounce, filterElements, mask, sleep, unmask } from "./utilities";
// import { debounce } from "lodash"; //bad - do not import all functions
//import debounce from "lodash/debounce"; //betters

let editId;
let allTeams = [];
const form = "#teamsForm";

function getTeamAsHTML({ id, url, promotion, members, name }) {
  const displayUrl = url.startsWith("https://github.com/") ? url.substring(19) : url;
  return `<tr>
    <td style= "text-align: center"><input type="checkbox" name="selected" value = "${id}"/></td>
    <td>${promotion}</td>
    <td>${members}</td>
    <td>${name}</td>
    <td><a href="${url} target="_blank">${displayUrl}</a></td>
    <td>
      <a data-id="${id}" class="remove-btn">✖</a>
      <a data-id="${id}" class="edit-btn">&#9998;</a>
    </td>
  </tr>`;
}

let previewDisplayTeams = [];

function displayTeams(teams) {
  if (teams == previewDisplayTeams) {
    console.warn("same teams already displayed");
    return;
  }

  if (teams.length === previewDisplayTeams.length) {
    if (teams.every((team, i) => team === previewDisplayTeams[i])) {
      console.warn("same content");
      return;
    }
  }

  previewDisplayTeams = teams;
  console.warn("displayTeams", teams);
  const teamsHTML = teams.map(getTeamAsHTML);
  $("#teamsTable tbody").innerHTML = teamsHTML.join("");
}

/**
 *
 * @returns {Promise<{id: string, promotion: string}[]>}
 */
function loadTeams() {
  return loadTeamsRequest().then(teams => {
    allTeams = teams;
    displayTeams(teams);
    return teams;
  });
}

function startEdit(id) {
  editId = id;
  const team = allTeams.find(team => team.id == id);
  setTeamValues(team);
}

function setTeamValues({ promotion, members, name, url }) {
  $("#promotion").value = promotion;
  $("#members").value = members;
  $("input[name=name]").value = name;
  $("input[name=url]").value = url;
}

function getTeamValues() {
  const promotion = $("#promotion").value;
  const members = $("#members").value;
  const name = $("input[name=name]").value;
  const url = $("input[name=url]").value;
  return {
    promotion,
    members,
    name: name,
    url: url
  };
}

async function onSubmit(e) {
  e.preventDefault();

  const team = getTeamValues();

  mask(form);
  let status;

  if (editId) {
    team.id = editId;
    console.warn("before");
    console.time("update");
    status = await updateTeamRequest(team);
    console.timeEnd("update");
    console.warn("after", status.success);
    if (status.success) {
      allTeams = allTeams.map(t => {
        if (t.id === editId) {
          //return team; OK
          //return {...team}; OK
          return {
            ...t,
            ...team
          };
        }
        return t;
      });
    }
  } else {
    status = await createTeamRequest(team);
    if (status.success) {
      //console.info("saved", JSON.parse(json.stringify(team)));
      team.id = status.id;
      // allTeams.push(team);
      allTeams = [...allTeams, team];
    }
  }
  if (status.success) {
    displayTeams(allTeams);
    $("#teamsForm").reset();
    unmask(form);
  }
}

async function removeSelected() {
  mask("#main");
  //console.time("remove");
  const selected = $$("input[name=selected]:checked");
  const ids = [...selected].map(input => input.value);
  const promises = ids.map(id => deleteTeamRequest(id));
  promises.push(sleep(2000));
  const statuses = await Promise.allSettled(promises);
  //console.timeEnd("remove");
  console.warn("statuses", statuses);

  await loadTeams();
  unmask("#main");
}

function initEvents() {
  $("#removeSelected").addEventListener("click", debounce(removeSelected, 200));
  $("#searchTeams").addEventListener(
    "input",
    debounce(function (e) {
      console.info("search:", this.value, e.target.value);
      const teams = filterElements(allTeams, e.target.value);
      displayTeams(teams);
    }, 400)
  );

  $("#selectAll").addEventListener("input", e => {
    $$("input[name=selected]").forEach(check => {
      check.checked = e.target.checked;
    });
  });

  $("#teamsTable tbody").addEventListener("click", e => {
    if (e.target.matches("a.remove-btn")) {
      const id = e.target.dataset.id;
      //console.warn("remove %o", id);
      mask(form);
      deleteTeamRequest(id, async ({ success }) => {
        if (success) {
          console.warn("delete done", status);
          await loadTeams();
          unmask(form);
        }
      });
    } else if (e.target.matches("a.edit-btn")) {
      const id = e.target.dataset.id;
      startEdit(id);
    }
  });

  $("#teamsForm").addEventListener("submit", onSubmit);
  $("#teamsForm").addEventListener("reset", () => {
    displayTeams(allTeams);
    console.warn("reset");
    editId = undefined;
  });
}

initEvents();

(async () => {
  mask(form);
  await loadTeams();
  unmask(form);
})();
