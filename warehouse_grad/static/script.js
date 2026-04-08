const inventoryBody = document.getElementById("inventory-body");
const tableStatus = document.getElementById("table-status");
const totalItems = document.getElementById("total-items");
const totalUnits = document.getElementById("total-units");
const totalValue = document.getElementById("total-value");
const lowStockCount = document.getElementById("low-stock-count");
const refreshButton = document.getElementById("refresh-button");

const currencyFormatter = new Intl.NumberFormat("en-US", {
	style: "currency",
	currency: "USD",
});

function getStockStatus(item) {
	if (item.quantity_in_stock <= item.reorder_level) {
		return { label: "Low", className: "status-low" };
	}

	if (item.quantity_in_stock <= item.reorder_level * 2) {
		return { label: "Watch", className: "status-watch" };
	}

	return { label: "Healthy", className: "status-healthy" };
}

function renderMetrics(items) {
	const units = items.reduce((sum, item) => sum + item.quantity_in_stock, 0);
	const value = items.reduce((sum, item) => sum + item.quantity_in_stock * item.unit_price, 0);
	const lowStock = items.filter((item) => item.quantity_in_stock <= item.reorder_level).length;

	totalItems.textContent = items.length;
	totalUnits.textContent = units;
	totalValue.textContent = currencyFormatter.format(value);
	lowStockCount.textContent = lowStock;
}

function renderTable(items) {
	if (items.length === 0) {
		inventoryBody.innerHTML = '<tr><td colspan="10" class="empty-state">No inventory records found.</td></tr>';
		return;
	}

	inventoryBody.innerHTML = items
		.map((item) => {
			const status = getStockStatus(item);

			return `
				<tr>
					<td>${item.id}</td>
					<td>${item.sku}</td>
					<td>${item.item_name}</td>
					<td>${item.category}</td>
					<td>${item.quantity_in_stock}</td>
					<td>${item.reorder_level}</td>
					<td>${currencyFormatter.format(item.unit_price)}</td>
					<td>${item.supplier ?? "Unassigned"}</td>
					<td><span class="status-pill ${status.className}">${status.label}</span></td>
					<td>
						<button type="button" class="delete-button" data-item-id="${item.id}" data-item-name="${item.item_name}">Delete</button>
					</td>
				</tr>
			`;
		})
		.join("");
}

async function deleteInventoryItem(itemId, itemName) {
	const confirmed = window.confirm(`Delete ${itemName}? This cannot be undone.`);
	if (!confirmed) {
		return;
	}

	tableStatus.textContent = `Deleting item #${itemId}...`;

	try {
		const response = await fetch(`/inventory/${itemId}`, { method: "DELETE" });

		if (!response.ok) {
			let errorMessage = `Delete failed with status ${response.status}`;
			try {
				const errorData = await response.json();
				if (errorData?.detail) {
					errorMessage = errorData.detail;
				}
			} catch {
				// Use default status-based message if response body is not JSON.
			}
			throw new Error(errorMessage);
		}

		await loadInventory();
		tableStatus.textContent = `Item #${itemId} deleted`;
	} catch (error) {
		tableStatus.textContent = error.message;
	}
}

async function loadInventory() {
	tableStatus.textContent = "Loading inventory...";
	refreshButton.disabled = true;

	try {
		const response = await fetch("/inventory");

		if (!response.ok) {
			throw new Error(`Request failed with status ${response.status}`);
		}

		const items = await response.json();
		renderMetrics(items);
		renderTable(items);
		tableStatus.textContent = `${items.length} records loaded`;
	} catch (error) {
		inventoryBody.innerHTML = '<tr><td colspan="10" class="empty-state error-state">Unable to load inventory data.</td></tr>';
		tableStatus.textContent = error.message;
		totalItems.textContent = "--";
		totalUnits.textContent = "--";
		totalValue.textContent = "--";
		lowStockCount.textContent = "--";
	} finally {
		refreshButton.disabled = false;
	}
}

inventoryBody.addEventListener("click", (event) => {
	const target = event.target;
	if (!(target instanceof HTMLButtonElement)) {
		return;
	}

	if (!target.classList.contains("delete-button")) {
		return;
	}

	const itemId = Number(target.dataset.itemId);
	const itemName = target.dataset.itemName ?? `item #${itemId}`;

	if (!Number.isInteger(itemId)) {
		tableStatus.textContent = "Unable to determine inventory item ID.";
		return;
	}

	deleteInventoryItem(itemId, itemName);
});

refreshButton.addEventListener("click", loadInventory);
window.addEventListener("DOMContentLoaded", loadInventory);
