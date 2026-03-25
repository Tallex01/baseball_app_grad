from fastapi.staticfiles import StaticFiles
from fastapi import FastAPI
from models import Batting, Teams, People, engine
from sqlmodel import Session, select

app = FastAPI()

@app.get("/years")   #endpoint 1 (with our background we can read this + understand it)
async def get_years():
	with Session(engine) as session:
		statement = select(Teams.yearID).distinct().order_by(Teams.yearID)
		years = session.exec(statement).all()
	return years

@app.get("/teams/{year}")
async def get_teams(year:int):
	with Session(engine) as session:
		statement = (
			select(Teams.teamID, Teams.name, Teams.lgID, Teams.divID)
			.where(Teams.yearID == year)
			.order_by(Teams.name)
		)
		rows = session.exec(statement).all()
	return [
		{"teamID": team_id, "name": name, "lgID": lg_id, "divID": div_id}
		for team_id, name, lg_id, div_id in rows
	]


@app.get("/players/{year}/{team_id}")
async def get_players(year: int, team_id: str):
	with Session(engine) as session:
		statement = (
			select(People.nameFirst, People.nameLast)
			.join(Batting, Batting.playerID == People.playerID)
			.where(Batting.yearID == year)
			.where(Batting.teamID == team_id)
			.distinct()
			.order_by(People.nameLast, People.nameFirst)
		)
		rows = session.exec(statement).all()

	return [
		{"firstName": first_name, "lastName": last_name}
		for first_name, last_name in rows
	]






app.mount("/", StaticFiles(directory="static", html=True), name="static")


