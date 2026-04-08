from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from sqlmodel import Session, select

from models import InventoryItem, create_db_and_tables, engine


app = FastAPI()


@app.on_event("startup")
def on_startup() -> None:
	create_db_and_tables()


@app.get("/inventory")
def get_inventory():
	with Session(engine) as session:
		inventory = session.exec(select(InventoryItem)).all()   #sqlmodel 
		return inventory

@app.delete("/inventory/{id}")
def delete_item(id: int):
	with Session(engine) as session:
		item = session.get(InventoryItem, id)
		if item is None:
			raise HTTPException(status_code=404, detail="Inventory item not found")

		session.delete(item)
		session.commit()
		return {"message": "Inventory item deleted", "id": id}

@app.post("/inventory")
def create_item(id: int):






app.mount("/", StaticFiles(directory="static", html=True), name="static")



