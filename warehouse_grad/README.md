# Sports Warehouse SQLite DB

This folder contains a simple SQLite database setup for a sports warehouse project.

## What gets created

- Database file: `sports_warehouse.db`
- Table: `inventory_items`
- Primary key: `id INTEGER PRIMARY KEY AUTOINCREMENT`
- Starter seed data for common sports items (basketballs, bats, hockey masks, etc.)

## Columns

- `id`: auto-increment item id
- `sku`: unique product code
- `product`: product name (stored in legacy DB column `item_name`)
- `category`: sport/category type
- `quantity_in_stock`: current stock quantity
- `unit_price`: item price
- `supplier`: optional supplier name
- `reorder_level`: stock threshold for restocking
- `created_at`: timestamp when row was created
- `updated_at`: timestamp updated automatically after row changes

## Run

From the repository root:

```bash
python3 warehouse_grad/build_warehouse_db.py
```

Then inspect with sqlite3:

```bash
sqlite3 warehouse_grad/sports_warehouse.db "SELECT id, sku, item_name, quantity_in_stock, unit_price FROM inventory_items;"
```
