const selectEl = document.getElementById("year-select");
const statusEl = document.getElementById("status");
const teamsTitleEl = document.getElementById("teams-title");
const teamsListEl = document.getElementById("teams-list");
const playerBioContentEl = document.getElementById("player-bio-content");
const playerStatsContentEl = document.getElementById("player-stats-content");

function ensurePlayerPanels() {
	let bioEl = document.getElementById("player-bio-content") || playerBioContentEl;
	let statsEl = document.getElementById("player-stats-content") || playerStatsContentEl;

	if (bioEl && statsEl) {
		return { bioEl, statsEl };
	}

	// If the panels are missing (e.g., older HTML), create them
	const widget = document.querySelector(".widget");
	if (!widget) {
		return { bioEl: null, statsEl: null };
	}

	let panelsContainer = document.querySelector(".player-panels");
	if (!panelsContainer) {
		panelsContainer = document.createElement("div");
		panelsContainer.className = "player-panels";
		widget.appendChild(panelsContainer);
	}

	const bioCard = document.createElement("div");
	bioCard.className = "player-card";
	const bioHeader = document.createElement("h3");
	bioHeader.textContent = "Player Bio";
	bioCard.appendChild(bioHeader);
	bioEl = document.createElement("div");
	bioEl.id = "player-bio-content";
	bioEl.className = "player-card-body muted";
	bioEl.textContent = "Select a player to see biographical information.";
	bioCard.appendChild(bioEl);

	const statsCard = document.createElement("div");
	statsCard.className = "player-card";
	const statsHeader = document.createElement("h3");
	statsHeader.textContent = "Batting Stats";
	statsCard.appendChild(statsHeader);
	statsEl = document.createElement("div");
	statsEl.id = "player-stats-content";
	statsEl.className = "player-card-body muted";
	statsEl.textContent = "Select a player to see batting statistics.";
	statsCard.appendChild(statsEl);

	panelsContainer.appendChild(bioCard);
	panelsContainer.appendChild(statsCard);

	return { bioEl, statsEl };
}

function clearPlayerDetail() {
	const { bioEl, statsEl } = ensurePlayerPanels();
	if (bioEl) {
		bioEl.classList.add("muted");
		bioEl.textContent = "Select a player to see biographical information.";
	}
	if (statsEl) {
		statsEl.classList.add("muted");
		statsEl.textContent = "Select a player to see batting statistics.";
	}
}

function sortTeamsByName(a, b) {
	return (a.name || "").localeCompare(b.name || "");
}

async function loadPlayersForTeam(year, teamId, buttonEl, playersListEl) {
	// Collapse any currently open team first
	document.querySelectorAll(".team-button.selected").forEach((btn) => {
		btn.classList.remove("selected");
	});
	document.querySelectorAll(".players-list").forEach((ul) => {
		ul.hidden = true;
	});

	// If this team was already open, we've just closed everything
	if (!playersListEl.hidden && playersListEl.childElementCount > 0) {
		statusEl.textContent = "Select a team to view players.";
		return;
	}

	buttonEl.classList.add("selected");
	statusEl.textContent = `Loading players for ${teamId} in ${year}...`;

	if (playersListEl.childElementCount === 0) {
		try {
			const response = await fetch(`/players/${year}/${teamId}`);
			if (!response.ok) {
				throw new Error(`Failed to load players (${response.status})`);
			}

			const players = await response.json();
			playersListEl.innerHTML = "";

			if (players.length === 0) {
				const li = document.createElement("li");
				li.textContent = "No players found for this team and year.";
				playersListEl.appendChild(li);
			} else {
				players.forEach((player) => {
					const li = document.createElement("li");
					const button = document.createElement("button");
					button.type = "button";
					button.className = "player-button";
					const displayName = `${player.firstName || ""} ${player.lastName || ""}`.trim() || player.playerID;
					button.textContent = displayName;
					button.addEventListener("click", () => {
						if (!player.playerID) return;
						loadPlayerDetail(player.playerID, displayName);
					});
					li.appendChild(button);
					playersListEl.appendChild(li);
				});
			}
		} catch (error) {
			playersListEl.innerHTML = "";
			const li = document.createElement("li");
			li.textContent = "Could not load players.";
			playersListEl.appendChild(li);
			statusEl.textContent = "Error loading players for the selected team.";
			console.error(error);
			playersListEl.hidden = false;
			return;
		}
	}

	playersListEl.hidden = false;
	statusEl.textContent = `Showing players for ${teamId} in ${year}.`;
}

async function loadPlayerDetail(playerId, displayName) {
	if (!playerId) return;
	statusEl.textContent = `Loading details for ${displayName}...`;

	try {
		const response = await fetch(`/player/${playerId}`);
		if (!response.ok) {
			throw new Error(`Failed to load player details (${response.status})`);
		}

		const data = await response.json();
		renderPlayerBio(data.bio, displayName);
		renderPlayerStats(data.batting);
		statusEl.textContent = `Showing bio and stats for ${displayName}.`;
	} catch (error) {
		console.error(error);
		const { bioEl, statsEl } = ensurePlayerPanels();
		if (bioEl) {
			bioEl.classList.add("muted");
			bioEl.textContent = "Could not load player information.";
		}
		if (statsEl) {
			statsEl.classList.add("muted");
			statsEl.textContent = "Could not load batting statistics.";
		}
		statusEl.textContent = "Error loading player details.";
	}
}

function renderPlayerBio(bio, displayName) {
	const { bioEl } = ensurePlayerPanels();
	if (!bioEl) return;
	bioEl.classList.remove("muted");
	bioEl.innerHTML = "";

	if (!bio) {
		bioEl.textContent = "No biographical information available.";
		return;
	}

	const nameLine = [bio.nameFirst, bio.nameLast].filter(Boolean).join(" ") || displayName || bio.playerID;
	const dl = document.createElement("dl");

	function addRow(label, value) {
		if (!value) return;
		const dt = document.createElement("dt");
		dt.textContent = label;
		const dd = document.createElement("dd");
		dd.textContent = value;
		dl.appendChild(dt);
		dl.appendChild(dd);
	}

	addRow("Name", nameLine);

	const birthParts = [bio.birthYear, bio.birthMonth, bio.birthDay].filter((v) => v != null);
	let birthDate = "";
	if (birthParts.length > 0) {
		birthDate = birthParts.join("-");
	}
	const birthPlaceParts = [bio.birthCity, bio.birthState, bio.birthCountry].filter(Boolean);
	let birthPlace = birthPlaceParts.join(", ");
	let birth = "";
	if (birthDate && birthPlace) {
		birth = `${birthDate} in ${birthPlace}`;
	} else if (birthDate) {
		birth = birthDate;
	} else if (birthPlace) {
		birth = birthPlace;
	}
	addRow("Born", birth);

	const deathParts = [bio.deathYear, bio.deathMonth, bio.deathDay].filter((v) => v != null);
	let deathDate = "";
	if (deathParts.length > 0) {
		deathDate = deathParts.join("-");
	}
	const deathPlaceParts = [bio.deathCity, bio.deathState, bio.deathCountry].filter(Boolean);
	let deathPlace = deathPlaceParts.join(", ");
	let death = "";
	if (deathDate && deathPlace) {
		death = `${deathDate} in ${deathPlace}`;
	} else if (deathDate) {
		death = deathDate;
	} else if (deathPlace) {
		death = deathPlace;
	}
	addRow("Died", death);

	const batsThrows = [bio.bats && `Bats: ${bio.bats}`, bio.throws && `Throws: ${bio.throws}`]
		.filter(Boolean)
		.join("; ");
	addRow("Bats / Throws", batsThrows);

	const physical = [
		bio.height != null ? `${bio.height} in` : null,
		bio.weight != null ? `${bio.weight} lbs` : null,
	]
		.filter(Boolean)
		.join(", ");
	addRow("Height / Weight", physical);

	addRow("Debut", bio.debut || "");
	addRow("Final Game", bio.finalGame || "");

	bioEl.appendChild(dl);
}

function renderPlayerStats(battingRows) {
	const { statsEl } = ensurePlayerPanels();
	if (!statsEl) return;
	statsEl.classList.remove("muted");
	statsEl.innerHTML = "";

	if (!battingRows || battingRows.length === 0) {
		statsEl.textContent = "No batting records available.";
		return;
	}

	const table = document.createElement("table");
	table.className = "stats-table";
	const thead = document.createElement("thead");
	const headerRow = document.createElement("tr");

	const columns = [
		{ key: "yearID", label: "Year" },
		{ key: "teamID", label: "Team" },
		{ key: "lgID", label: "Lg" },
		{ key: "G", label: "G" },
		{ key: "AB", label: "AB" },
		{ key: "R", label: "R" },
		{ key: "H", label: "H" },
		{ key: "twoB", label: "2B" },
		{ key: "threeB", label: "3B" },
		{ key: "HR", label: "HR" },
		{ key: "RBI", label: "RBI" },
		{ key: "SB", label: "SB" },
		{ key: "CS", label: "CS" },
		{ key: "BB", label: "BB" },
		{ key: "SO", label: "SO" },
	];

	columns.forEach((col) => {
		const th = document.createElement("th");
		th.textContent = col.label;
		headerRow.appendChild(th);
	});
	thead.appendChild(headerRow);
	table.appendChild(thead);

	const tbody = document.createElement("tbody");
	const currentYear = parseInt(selectEl.value || "", 10);
	let hasInitialSelection = false;

	battingRows.forEach((row) => {
		const tr = document.createElement("tr");
		tr.dataset.yearId = row.yearID != null ? String(row.yearID) : "";
		tr.dataset.teamId = row.teamID || "";
		const rowYear = row.yearID != null ? Number(row.yearID) : null;
		if (!hasInitialSelection && Number.isFinite(currentYear) && rowYear === currentYear) {
			tr.classList.add("stats-row-selected");
			hasInitialSelection = true;
		}
		columns.forEach((col) => {
			const td = document.createElement("td");
			const value = row[col.key];
			td.textContent = value == null ? "" : String(value);
			tr.appendChild(td);
		});
		tr.addEventListener("click", () => {
			// Clear previous selection within this table
			Array.from(tbody.querySelectorAll("tr.stats-row-selected")).forEach((r) => {
				r.classList.remove("stats-row-selected");
			});
			tr.classList.add("stats-row-selected");
		});
		tbody.appendChild(tr);
	});

	table.appendChild(tbody);
	statsEl.appendChild(table);
}

function createTeamRow(year, team) {
	const li = document.createElement("li");
	li.className = "team-item";

	const button = document.createElement("button");
	button.type = "button";
	button.className = "team-button";
	button.textContent = `${team.name} (${team.teamID})`;
	button.dataset.teamId = team.teamID;
	button.dataset.year = String(year);

	const playersList = document.createElement("ul");
	playersList.className = "players-list";
	playersList.hidden = true;

	button.addEventListener("click", () => {
		const yearVal = button.dataset.year;
		const teamIdVal = button.dataset.teamId;
		if (!yearVal || !teamIdVal) return;
		loadPlayersForTeam(yearVal, teamIdVal, button, playersList);
	});

	li.appendChild(button);
	li.appendChild(playersList);
	return li;
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
					const row = createTeamRow(year, team);
					teamList.appendChild(row);
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

		clearPlayerDetail();
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
		clearPlayerDetail();

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
		clearPlayerDetail();
		return;
	}
	loadTeamsByYear(selectedYear);
});

loadYears();
