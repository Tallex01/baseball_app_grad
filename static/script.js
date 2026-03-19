const selectEl = document.getElementById("year-select");
const statusEl = document.getElementById("status");
const teamsTitleEl = document.getElementById("teams-title");
const teamsListEl = document.getElementById("teams-list");

function renderTeams(year, teams) {
	teamsTitleEl.textContent = `Teams (${year})`;
	teamsListEl.innerHTML = "";

	teams.forEach((team) => {
		const li = document.createElement("li");
		li.textContent = `${team.name} (${team.teamID})`;
		teamsListEl.appendChild(li);
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
