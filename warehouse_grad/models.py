from __future__ import annotations

from datetime import datetime
from pathlib import Path
from typing import Optional

from sqlalchemy import Column, DateTime, String, func
from sqlmodel import Field, SQLModel, create_engine


BASE_DIR = Path(__file__).resolve().parent
DATABASE_URL = f"sqlite:///{BASE_DIR / 'sports_warehouse.db'}"


class InventoryItem(SQLModel, table=True):
	__tablename__ = "inventory_items"

	id: Optional[int] = Field(default=None, primary_key=True)
	sku: str = Field(index=True, unique=True, nullable=False)
	# Keep compatibility with existing SQLite schema where the column name is item_name.
	product: str = Field(sa_column=Column("item_name", String, nullable=False))
	category: str = Field(nullable=False)
	quantity_in_stock: int = Field(default=0, nullable=False)
	unit_price: float = Field(nullable=False)
	supplier: Optional[str] = Field(default=None)
	reorder_level: int = Field(default=5, nullable=False)
	created_at: datetime = Field(
		sa_column=Column(DateTime, server_default=func.now(), nullable=False)
	)
	updated_at: datetime = Field(
		sa_column=Column(
			DateTime,
			server_default=func.now(),
			onupdate=func.now(),
			nullable=False,
		)
	)


engine = create_engine(DATABASE_URL, echo=False)


def create_db_and_tables() -> None:
	SQLModel.metadata.create_all(engine)
