from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from sqlalchemy.exc import IntegrityError
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

@app.post("/inventory", status_code=201)
def create_item(item: InventoryItem):
	if item.quantity_in_stock < 0:
		raise HTTPException(status_code=400, detail="quantity_in_stock must be 0 or greater")

	if item.unit_price < 0:
		raise HTTPException(status_code=400, detail="unit_price must be 0 or greater")

	if item.reorder_level < 0:
		raise HTTPException(status_code=400, detail="reorder_level must be 0 or greater")

	item_data = item.model_dump(exclude={"id", "created_at", "updated_at"})
	new_item = InventoryItem(**item_data)

	with Session(engine) as session:
		session.add(new_item)
		try:
			session.commit()
		except IntegrityError:
			session.rollback()
			raise HTTPException(status_code=409, detail="SKU already exists")

		session.refresh(new_item)
		return new_item






app.mount("/", StaticFiles(directory="static", html=True), name="static")



