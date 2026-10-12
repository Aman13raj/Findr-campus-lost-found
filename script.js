"use strict";

/* ==========================================
   FINDR | Campus Lost & Found Portal
   - Items are rendered from a data array
   - Search + type + category filters work together
   - "Read More" opens a details dialog
   - Report form saves new items in localStorage
========================================== */

const STORAGE_KEY = "findr-user-items";
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const PLACEHOLDER_IMAGE =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400">' +
        '<rect width="600" height="400" fill="#eaf0eb"/>' +
        '<text x="300" y="210" font-family="Arial" font-size="28" fill="#6d7972" text-anchor="middle">No photo</text>' +
        "</svg>"
    );

/* ---------- Sample data (edit freely) ---------- */
const defaultItems = [
    {
        id: "sample-1",
        name: "Wireless Earbuds",
        type: "Found",
        category: "Electronics",
        location: "College Library",
        date: "2026-10-10",
        description: "White wireless earbuds with a charging case, found on a reading table near the window. Describe the case marks to claim them.",
        image: "https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?auto=format&fit=crop&w=600&q=80",
        alt: "White wireless earbuds"
    },
    {
        id: "sample-2",
        name: "Sports Shoe",
        type: "Lost",
        category: "Footwear",
        location: "Sports Ground",
        date: "2026-10-09",
        description: "Black sports shoe lost after the evening practice session. Size and brand can be shared with the person who finds it.",
        image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80",
        alt: "Black sports shoe"
    },
    {
        id: "sample-3",
        name: "Brown Wallet",
        type: "Found",
        category: "Accessories",
        location: "Main Block",
        date: "2026-10-08",
        description: "Brown leather wallet found near the main block staircase. The owner should describe what is inside to verify it.",
        image: "https://images.unsplash.com/photo-1622560480654-d96214fdc887?auto=format&fit=crop&w=600&q=80",
        alt: "Brown wallet"
    },
    {
        id: "sample-4",
        name: "Water Bottle",
        type: "Found",
        category: "Bottle",
        location: "Cafeteria",
        date: "2026-10-07",
        description: "Reusable steel water bottle left on a cafeteria table. Colour and any stickers will help identify the owner.",
        image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=600&q=80",
        alt: "Reusable water bottle"
    }
];

/* ---------- Element references ---------- */
const itemList = document.getElementById("itemList");
const emptyMessage = document.getElementById("emptyMessage");
const searchInput = document.getElementById("searchInput");
const navSearchInput = document.getElementById("navSearchInput");
const navSearchForm = document.getElementById("navSearchForm");
const typeFilter = document.getElementById("typeFilter");
const categoryFilter = document.getElementById("categoryFilter");
const itemForm = document.getElementById("itemForm");
const formMessage = document.getElementById("formMessage");
const itemDateInput = document.getElementById("itemDate");
const itemImageInput = document.getElementById("itemImage");

const dialog = document.getElementById("itemDialog");
const dialogClose = document.getElementById("dialogClose");
const dialogGuidelines = document.getElementById("dialogGuidelines");

/* ---------- State ---------- */
let items = [...loadUserItems(), ...defaultItems];

/* ---------- Storage ---------- */
function loadUserItems() {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
        return Array.isArray(saved) ? saved : [];
    } catch (error) {
        return [];
    }
}

function saveUserItems() {
    try {
        const userItems = items.filter(function (item) {
            return item.isUser;
        });
        localStorage.setItem(STORAGE_KEY, JSON.stringify(userItems));
        return true;
    } catch (error) {
        return false; // storage full or blocked
    }
}

/* ---------- Helpers ---------- */
function createElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
}

function formatDate(isoDate) {
    const parts = String(isoDate).split("-");
    if (parts.length !== 3) return isoDate;
    return parts[2] + " " + MONTHS[Number(parts[1]) - 1] + " " + parts[0];
}

function todayISO() {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return now.getFullYear() + "-" + month + "-" + day;
}

function createDetail(label, value) {
    const paragraph = createElement("p", "item-detail");
    paragraph.appendChild(createElement("strong", "", label + ":"));
    paragraph.appendChild(document.createTextNode(" " + value));
    return paragraph;
}

/* ---------- Rendering ---------- */
function createCard(item) {
    const card = createElement("article", "item-card");

    const imageWrap = createElement("div", "item-image");
    const image = document.createElement("img");
    image.src = item.image || PLACEHOLDER_IMAGE;
    image.alt = item.image ? (item.alt || item.name) : "No photo available";
    image.loading = "lazy";
    image.addEventListener("error", function () {
        image.src = PLACEHOLDER_IMAGE;
    }, { once: true });

    const badgeClass = item.type === "Lost" ? "badge-lost" : "badge-found";
    imageWrap.appendChild(image);
    imageWrap.appendChild(createElement("span", "item-badge " + badgeClass, item.type));

    const content = createElement("div", "item-card-content");
    content.appendChild(createElement("p", "item-category", item.category));
    content.appendChild(createElement("h3", "", item.name));
    content.appendChild(createDetail("Location", item.location));
    content.appendChild(createDetail("Date", formatDate(item.date)));

    const button = createElement("button", "read-more-button", "Read More");
    button.type = "button";
    button.dataset.itemId = item.id;
    content.appendChild(button);

    card.appendChild(imageWrap);
    card.appendChild(content);
    return card;
}

function getFilteredItems() {
    const query = searchInput.value.trim().toLowerCase();
    const type = typeFilter.value;
    const category = categoryFilter.value;

    return items.filter(function (item) {
        const searchable = [item.name, item.location, item.category, item.description]
            .join(" ")
            .toLowerCase();

        const matchesSearch = query === "" || searchable.includes(query);
        const matchesType = type === "All" || item.type === type;
        const matchesCategory = category === "All" || item.category === category;

        return matchesSearch && matchesType && matchesCategory;
    });
}

function renderItems() {
    const filtered = getFilteredItems();
    itemList.replaceChildren(...filtered.map(createCard));
    emptyMessage.hidden = filtered.length > 0;
}

/* ---------- Search and filters ---------- */
searchInput.addEventListener("input", function () {
    navSearchInput.value = searchInput.value;
    renderItems();
});

navSearchInput.addEventListener("input", function () {
    searchInput.value = navSearchInput.value;
    renderItems();
});

navSearchForm.addEventListener("submit", function (event) {
    event.preventDefault(); // stop the page from reloading
    document.getElementById("items").scrollIntoView({ behavior: "smooth" });
});

typeFilter.addEventListener("change", renderItems);
categoryFilter.addEventListener("change", renderItems);

/* ---------- Details dialog ---------- */
itemList.addEventListener("click", function (event) {
    const button = event.target.closest(".read-more-button");
    if (!button) return;

    const item = items.find(function (entry) {
        return entry.id === button.dataset.itemId;
    });
    if (item) openDialog(item);
});

function openDialog(item) {
    const dialogImage = document.getElementById("dialogImage");
    dialogImage.src = item.image || PLACEHOLDER_IMAGE;
    dialogImage.alt = item.image ? (item.alt || item.name) : "No photo available";

    const badge = document.getElementById("dialogBadge");
    badge.textContent = item.type;
    badge.className = "item-badge " + (item.type === "Lost" ? "badge-lost" : "badge-found");

    document.getElementById("dialogCategory").textContent = item.category;
    document.getElementById("dialogTitle").textContent = item.name;
    document.getElementById("dialogLocation").textContent = item.location;
    document.getElementById("dialogDate").textContent = formatDate(item.date);
    document.getElementById("dialogDescription").textContent = item.description;

    dialog.showModal();
}

dialogClose.addEventListener("click", function () {
    dialog.close();
});

dialogGuidelines.addEventListener("click", function () {
    dialog.close();
});

// Clicking the dark backdrop closes the dialog
dialog.addEventListener("click", function (event) {
    if (event.target === dialog) dialog.close();
});

/* ---------- Report form ---------- */
function showMessage(text, isError) {
    formMessage.textContent = text;
    formMessage.classList.toggle("is-error", Boolean(isError));
}

function setDateDefaults() {
    const today = todayISO();
    itemDateInput.max = today;   // no future dates
    itemDateInput.value = today;
}

// Resize the photo so it fits comfortably in localStorage
function resizeImage(file, maxSize) {
    return new Promise(function (resolve, reject) {
        const reader = new FileReader();

        reader.onerror = function () {
            reject(new Error("Could not read the file."));
        };

        reader.onload = function () {
            const img = new Image();

            img.onerror = function () {
                reject(new Error("This file is not a valid image."));
            };

            img.onload = function () {
                const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
                const canvas = document.createElement("canvas");
                canvas.width = Math.round(img.width * scale);
                canvas.height = Math.round(img.height * scale);

                const context = canvas.getContext("2d");
                context.fillStyle = "#fff"; // PNG transparency -> white
                context.fillRect(0, 0, canvas.width, canvas.height);
                context.drawImage(img, 0, 0, canvas.width, canvas.height);

                resolve(canvas.toDataURL("image/jpeg", 0.75));
            };

            img.src = reader.result;
        };

        reader.readAsDataURL(file);
    });
}

itemForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const data = new FormData(itemForm);
    const name = String(data.get("itemName")).trim();
    const location = String(data.get("itemLocation")).trim();
    const description = String(data.get("itemDescription")).trim();

    // "required" accepts spaces-only text, so check again after trim()
    if (!name || !location || !description) {
        showMessage("Please fill in the item name, location and description (spaces alone are not valid).", true);
        return;
    }

    let image = "";
    const file = itemImageInput.files[0];

    if (file) {
        if (file.size > MAX_IMAGE_SIZE) {
            showMessage("Photo is too large. Please choose an image under 5 MB.", true);
            return;
        }

        try {
            image = await resizeImage(file, 600);
        } catch (error) {
            showMessage(error.message, true);
            return;
        }
    }

    const newItem = {
        id: "user-" + Date.now(),
        name: name,
        type: String(data.get("itemType")),
        category: String(data.get("itemCategory")),
        location: location,
        date: String(data.get("itemDate")),
        description: description,
        image: image,
        isUser: true
    };

    items.unshift(newItem);
    const saved = saveUserItems();

    // Reset form and filters so the new item is visible right away
    itemForm.reset();
    setDateDefaults();
    searchInput.value = "";
    navSearchInput.value = "";
    typeFilter.value = "All";
    categoryFilter.value = "All";
    renderItems();

    showMessage(
        saved
            ? "✓ Report submitted! Your item now appears in Recently Reported Items."
            : "Report added, but it could not be saved in this browser (storage is full or blocked).",
        !saved
    );
});

/* ---------- Start ---------- */
setDateDefaults();
renderItems();
