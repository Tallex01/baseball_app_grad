const selectEl = document.getElementById("year-select");
const statusEl = document.getElementById("status");
const teamsTitleEl = document.getElementById("teams-title");
const teamsListEl = document.getElementById("teams-list");

function sortTeamsByName(a, b) {
	return (a.name || "").localeCompare(b.name || "");
}

function renderTeams(year, teams) {
	teamsTitleEl.textContent = `Teams (${year})`;
	teamsListEl.innerHTML = "";

	const leagueMap = new Map();

	teams.forEach((team) => {
		const leagueKey = team.lgID || "Unknown League";
		const divisionKey = team.divID || "Other Teams";

		if (!leagueMap.has(leagueKey)) {
			leagueMap.set(leagueKey, new Map());
		}

		const divisionMap = leagueMap.get(leagueKey);
		if (!divisionMap.has(divisionKey)) {
			divisionMap.set(divisionKey, []);
		}

		divisionMap.get(divisionKey).push(team);
	});

	const leagueKeys = Array.from(leagueMap.keys()).sort();

	leagueKeys.forEach((leagueKey) => {
		const leagueLi = document.createElement("li");
		leagueLi.className = "league-item";

		const leagueHeading = document.createElement("p");
		leagueHeading.className = "league-heading";
		leagueHeading.textContent = leagueKey;
		leagueLi.appendChild(leagueHeading);

		const divisionList = document.createElement("ul");
		divisionList.className = "division-list";

		const divisionMap = leagueMap.get(leagueKey);
		const divisionKeys = Array.from(divisionMap.keys()).sort();

		divisionKeys.forEach((divisionKey) => {
			const divisionLi = document.createElement("li");
			divisionLi.className = "division-item";

			const divisionHeading = document.createElement("p");
			divisionHeading.className = "division-heading";
			divisionHeading.textContent =
				divisionKey === "Other Teams" ? "Other Teams" : `${divisionKey} Division`;
			divisionLi.appendChild(divisionHeading);

			const teamList = document.createElement("ul");
			teamList.className = "team-list";

			divisionMap
				.get(divisionKey)
				.sort(sortTeamsByName)
				.forEach((team) => {
					const li = document.createElement("li");
					li.textContent = `${team.name} (${team.teamID})`;
					teamList.appendChild(li);
				});

			divisionLi.appendChild(teamList);
			divisionList.appendChild(divisionLi);
		});

		leagueLi.appendChild(divisionList);
		teamsListEl.appendChild(leagueLi);
	});
}

async function loadTeamsByYear(year) {
	try {
		const response = await fetch(`/teams/${year}`);
		if (!response.ok) {
			throw new Error(`Failed to load teams (${response.status})`);
		}

		const teams = await response.json();
		if (teams.length === 0) {
			teamsTitleEl.textContent = `Teams (${year})`;
			teamsListEl.innerHTML = "";
			statusEl.textContent = `No teams found for ${year}.`;
			return;
		}

		renderTeams(year, teams);
		statusEl.textContent = `Loaded ${teams.length} teams for ${year}.`;
	} catch (error) {
		teamsTitleEl.textContent = "Teams";
		teamsListEl.innerHTML = "";
		statusEl.textContent = "Could not load teams for the selected year.";
		console.error(error);
	}
}

async function loadYears() {
	try {
		const response = await fetch("/years");
		if (!response.ok) {
			throw new Error(`Failed to load years (${response.status})`);
		}

		const years = await response.json();
		selectEl.innerHTML = "";

		const placeholder = document.createElement("option");
		placeholder.value = "";
		placeholder.textContent = "Select a year";
		placeholder.selected = true;
		placeholder.disabled = true;
		selectEl.appendChild(placeholder);

		years.forEach((year) => {
			const option = document.createElement("option");
			option.value = String(year);
			option.textContent = String(year);
			selectEl.appendChild(option);
		});

		statusEl.textContent = "Select a year to load teams.";
		teamsTitleEl.textContent = "Teams";
		teamsListEl.innerHTML = "";

	} catch (error) {
		selectEl.innerHTML = "";
		const errorOption = document.createElement("option");
		errorOption.value = "";
		errorOption.textContent = "Unable to load years";
		selectEl.appendChild(errorOption);
		teamsTitleEl.textContent = "Teams";
		teamsListEl.innerHTML = "";
		statusEl.textContent = "Could not load years from the API.";
		console.error(error);
	}
}

selectEl.addEventListener("change", (event) => {
	const selectedYear = event.target.value;
	if (!selectedYear) {
		teamsTitleEl.textContent = "Teams";
		teamsListEl.innerHTML = "";
		statusEl.textContent = "Select a year to load teams.";
		return;
	}
	loadTeamsByYear(selectedYear);
});

loadYears();
