const inventoryBody = document.getElementById("inventory-body");
const tableStatus = document.getElementById("table-status");
const totalItems = document.getElementById("total-items");
const totalUnits = document.getElementById("total-units");
const totalValue = document.getElementById("total-value");
const lowStockCount = document.getElementById("low-stock-count");
const refreshButton = document.getElementById("refresh-button");
const addItemForm = document.getElementById("add-item-form");
const addItemButton = document.getElementById("add-item-button");
const cancelEditButton = document.getElementById("cancel-edit-button");
const formStatus = document.getElementById("form-status");
const formEyebrow = document.getElementById("form-eyebrow");
const formTitle = document.getElementById("form-title");

let editingItemId = null;

const formFields = {
	sku: document.getElementById("sku"),
	product: document.getElementById("product"),
	category: document.getElementById("category"),
	quantity_in_stock: document.getElementById("quantity_in_stock"),
	unit_price: document.getElementById("unit_price"),
	supplier: document.getElementById("supplier"),
	reorder_level: document.getElementById("reorder_level"),
};

const formErrors = {
	sku: document.getElementById("sku-error"),
	product: document.getElementById("product-error"),
	category: document.getElementById("category-error"),
	quantity_in_stock: document.getElementById("quantity_in_stock-error"),
	unit_price: document.getElementById("unit_price-error"),
	supplier: document.getElementById("supplier-error"),
	reorder_level: document.getElementById("reorder_level-error"),
};

const currencyFormatter = new Intl.NumberFormat("en-US", {
	style: "currency",
	currency: "USD",
});

function setFormStatus(message, type = "") {
	formStatus.textContent = message;
	formStatus.classList.remove("error", "success");
	if (type) {
		formStatus.classList.add(type);
	}
}

function setFieldError(fieldName, message = "") {
	const input = formFields[fieldName];
	const error = formErrors[fieldName];

	if (!input || !error) {
		return;
	}

	error.textContent = message;
	input.classList.toggle("invalid", Boolean(message));
}

function clearFormErrors() {
	Object.keys(formErrors).forEach((fieldName) => {
		setFieldError(fieldName, "");
	});
}

function resetFormToCreateMode(keepStatus = false) {
	editingItemId = null;
	addItemForm.reset();
	formFields.reorder_level.value = "5";
	addItemButton.textContent = "Add Item";
	formEyebrow.textContent = "Create";
	formTitle.textContent = "Add Inventory Item";
	cancelEditButton.hidden = true;
	clearFormErrors();
	if (!keepStatus) {
		setFormStatus("Fill out all required fields.");
	}
}

function populateFormForEdit(item) {
	editingItemId = item.id;
	formFields.sku.value = item.sku;
	formFields.product.value = item.product;
	formFields.category.value = item.category;
	formFields.quantity_in_stock.value = String(item.quantity_in_stock);
	formFields.unit_price.value = String(item.unit_price);
	formFields.supplier.value = item.supplier ?? "";
	formFields.reorder_level.value = String(item.reorder_level);

	addItemButton.textContent = "Save Changes";
	formEyebrow.textContent = "Update";
	formTitle.textContent = `Edit Item #${item.id}`;
	cancelEditButton.hidden = false;
	clearFormErrors();
	setFormStatus(`Editing item #${item.id}. Update fields and save.`);
	formFields.product.focus();
}

function parseIntegerField(value) {
	if (value === "") {
		return NaN;
	}

	return Number.parseInt(value, 10);
}

function parseFloatField(value) {
	if (value === "") {
		return NaN;
	}

	return Number.parseFloat(value);
}

function getFormPayload() {
	const quantity = parseIntegerField(formFields.quantity_in_stock.value.trim());
	const unitPrice = parseFloatField(formFields.unit_price.value.trim());
	const reorderLevel = parseIntegerField(formFields.reorder_level.value.trim());

	return {
		sku: formFields.sku.value.trim(),
		product: formFields.product.value.trim(),
		category: formFields.category.value.trim(),
		quantity_in_stock: quantity,
		unit_price: unitPrice,
		supplier: formFields.supplier.value.trim() || null,
		reorder_level: reorderLevel,
	};
}

function validateForm(payload) {
	const errors = {};

	if (!payload.sku) {
		errors.sku = "SKU is required.";
	}

	if (!payload.product) {
		errors.product = "Product is required.";
	}

	if (!payload.category) {
		errors.category = "Category is required.";
	}

	if (!Number.isInteger(payload.quantity_in_stock)) {
		errors.quantity_in_stock = "Quantity must be a whole number.";
	} else if (payload.quantity_in_stock < 0) {
		errors.quantity_in_stock = "Quantity must be 0 or greater.";
	}

	if (Number.isNaN(payload.unit_price)) {
		errors.unit_price = "Unit price is required.";
	} else if (payload.unit_price < 0) {
		errors.unit_price = "Unit price must be 0 or greater.";
	}

	if (!Number.isInteger(payload.reorder_level)) {
		errors.reorder_level = "Reorder level must be a whole number.";
	} else if (payload.reorder_level < 0) {
		errors.reorder_level = "Reorder level must be 0 or greater.";
	}

	return errors;
}

function renderValidationErrors(errors) {
	clearFormErrors();
	Object.entries(errors).forEach(([fieldName, message]) => {
		setFieldError(fieldName, message);
	});
}

async function createInventoryItem(payload) {
	const response = await fetch("/inventory", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(payload),
	});

	if (!response.ok) {
		let errorMessage = `Create failed with status ${response.status}`;
		try {
			const errorData = await response.json();
			if (errorData?.detail) {
				errorMessage = errorData.detail;
			}
		} catch {
			// Keep default status message when backend response body is not JSON.
		}
		throw new Error(errorMessage);
	}

	return response.json();
}

async function updateInventoryItem(itemId, payload) {
	const response = await fetch(`/inventory/${itemId}`, {
		method: "PUT",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(payload),
	});

	if (!response.ok) {
		let errorMessage = `Update failed with status ${response.status}`;
		try {
			const errorData = await response.json();
			if (errorData?.detail) {
				errorMessage = errorData.detail;
			}
		} catch {
			// Keep default status message when backend response body is not JSON.
		}
		throw new Error(errorMessage);
	}

	return response.json();
}

async function handleAddItemSubmit(event) {
	event.preventDefault();

	const payload = getFormPayload();
	const errors = validateForm(payload);

	if (Object.keys(errors).length > 0) {
		renderValidationErrors(errors);
		setFormStatus("Please fix the highlighted fields.", "error");
		return;
	}

	clearFormErrors();
	setFormStatus(editingItemId === null ? "Adding item..." : `Updating item #${editingItemId}...`);
	addItemButton.disabled = true;
	cancelEditButton.disabled = true;

	try {
		let successMessage = "";
		if (editingItemId === null) {
			const created = await createInventoryItem(payload);
			successMessage = `Item ${created.sku} added successfully.`;
		} else {
			const updated = await updateInventoryItem(editingItemId, payload);
			successMessage = `Item #${updated.id} updated successfully.`;
		}

		resetFormToCreateMode(true);
		setFormStatus(successMessage, "success");
		await loadInventory();
	} catch (error) {
		if (error.message.toLowerCase().includes("sku")) {
			setFieldError("sku", error.message);
		}
		setFormStatus(error.message, "error");
	} finally {
		addItemButton.disabled = false;
		cancelEditButton.disabled = false;
	}
}

function wireInlineValidation() {
	Object.entries(formFields).forEach(([fieldName, input]) => {
		input.addEventListener("input", () => {
			const payload = getFormPayload();
			const errors = validateForm(payload);
			setFieldError(fieldName, errors[fieldName] ?? "");
		});
	});
}

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
					<td>${item.product}</td>
					<td>${item.category}</td>
					<td>${item.quantity_in_stock}</td>
					<td>${item.reorder_level}</td>
					<td>${currencyFormatter.format(item.unit_price)}</td>
					<td>${item.supplier ?? "Unassigned"}</td>
					<td><span class="status-pill ${status.className}">${status.label}</span></td>
					<td>
						<button type="button" class="edit-button" data-item-id="${item.id}" data-item-sku="${item.sku}" data-item-product="${item.product}" data-item-category="${item.category}" data-item-quantity="${item.quantity_in_stock}" data-item-price="${item.unit_price}" data-item-supplier="${item.supplier ?? ""}" data-item-reorder="${item.reorder_level}">Edit</button>
						<button type="button" class="delete-button" data-item-id="${item.id}" data-item-name="${item.product}">Delete</button>
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

	if (target.classList.contains("edit-button")) {
		const itemId = Number(target.dataset.itemId);
		if (!Number.isInteger(itemId)) {
			tableStatus.textContent = "Unable to determine inventory item ID.";
			return;
		}

		populateFormForEdit({
			id: itemId,
			sku: target.dataset.itemSku ?? "",
			product: target.dataset.itemProduct ?? "",
			category: target.dataset.itemCategory ?? "",
			quantity_in_stock: Number(target.dataset.itemQuantity ?? 0),
			unit_price: Number(target.dataset.itemPrice ?? 0),
			supplier: target.dataset.itemSupplier ?? "",
			reorder_level: Number(target.dataset.itemReorder ?? 0),
		});
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
addItemForm.addEventListener("submit", handleAddItemSubmit);
cancelEditButton.addEventListener("click", resetFormToCreateMode);
wireInlineValidation();
window.addEventListener("DOMContentLoaded", loadInventory);
