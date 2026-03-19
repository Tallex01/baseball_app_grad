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
			select(Teams.teamID, Teams.name)
			.where(Teams.yearID == year)
			.order_by(Teams.name)
		)
		rows = session.exec(statement).all()
	return [{"teamID": team_id, "name": name} for team_id, name in rows]






app.mount("/", StaticFiles(directory="static", html=True), name="static")


