"use strict";

const SUPABASE_URL = "https://iffrezhshlytpaxzoaob.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_YpWFZOlBwtRhDDF7olE2NA_VzA7FLmu";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);

console.log("Findr Supabase client ready!");


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

const itemContactEmail = document.getElementById("itemContactEmail");

const claimForm = document.getElementById("claimForm");
const claimItemId = document.getElementById("claimItemId");
const claimantName = document.getElementById("claimantName");
const claimantEmail = document.getElementById("claimantEmail");
const claimMessageInput = document.getElementById("claimMessage");
const claimMessageStatus = document.getElementById("claimMessageStatus");
const dialogContactEmail = document.getElementById("dialogContactEmail");


const dialog = document.getElementById("itemDialog");
const dialogClose = document.getElementById("dialogClose");
const dialogGuidelines = document.getElementById("dialogGuidelines");

/* ---------- State ---------- */
let items = [...loadUserItems(), ...defaultItems];
let databaseItems = [];

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

/* ---------- Load reports from Supabase ---------- */
async function loadDatabaseItems() {
    const { data, error } = await supabaseClient
        .from("items")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Could not load reports:", error.message);
        showMessage("Database se reports load nahi ho paayi.", true);
        return;
    }

    databaseItems = data.map(function (row) {
        return {
            id: row.id,
            name: row.name,
            type: row.type,
            category: row.category,
            location: row.location,
            contactEmail: row.contact_email || "",
            date: row.item_date || "",
            description: row.description,
            image: row.image_url || "",
            isUser: true
        };
    });

    
items = [...databaseItems, ...defaultItems];

renderItems();

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
    
if (item.contactEmail) {
    dialogContactEmail.textContent = item.contactEmail;
    dialogContactEmail.href = "mailto:" + item.contactEmail;
    dialogContactEmail.hidden = false;
} else {
    dialogContactEmail.textContent = "Contact not provided";
    dialogContactEmail.removeAttribute("href");
    dialogContactEmail.hidden = false;
}

claimItemId.value = item.id;
claimMessageStatus.textContent = "";
claimForm.reset();
claimItemId.value = item.id;


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

/* ---------- Upload photo to Supabase Storage ---------- */
async function uploadItemImage(file) {
    const extension = file.name.split(".").pop().toLowerCase();
    const allowedExtensions = ["jpg", "jpeg", "png", "webp"];

    if (!allowedExtensions.includes(extension)) {
        throw new Error("Please upload a JPG, PNG, or WebP image.");
    }

    const filePath =
        Date.now() + "-" + crypto.randomUUID() + "." + extension;

    const { error } = await supabaseClient.storage
        .from("item-images")
        .upload(filePath, file, {
            upsert: false,
            contentType: file.type
        });

    if (error) {
        throw new Error("Photo upload failed: " + error.message);
    }

    const { data } = supabaseClient.storage
        .from("item-images")
        .getPublicUrl(filePath);

    return data.publicUrl;
}


itemForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const data = new FormData(itemForm);
    const name = String(data.get("itemName")).trim();
    const location = String(data.get("itemLocation")).trim();
    const description = String(data.get("itemDescription")).trim();
    const contactEmail = String(data.get("itemContactEmail") || "").trim();

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
        showMessage("Uploading photo...", false);
        image = await uploadItemImage(file);
    } catch (error) {
        console.error(error);
        showMessage(error.message, true);
        return;
    }
}


    const newItem = {
        id: "user-" + Date.now(),
        name: name,
        contactEmail: contactEmail,
        type: String(data.get("itemType")),
        category: String(data.get("itemCategory")),
        location: location,
        date: String(data.get("itemDate")),
        description: description,
        image: image,
        isUser: true
    };

const { data: savedItem, error } = await supabaseClient
    .from("items")
    .insert({
        name: newItem.name,
        type: newItem.type,
        category: newItem.category,
        location: newItem.location,
        item_date: newItem.date || null,
        description: newItem.description,
        image_url: image || null,
        contact_email: contactEmail
    })
    .select()
    .single();

if (error) {
    console.error("Report save error:", error.message);
    showMessage("Report save nahi hua. Please try again.", true);
    return;
}

items.unshift({
    ...newItem,
    id: savedItem.id,
    isUser: true
});

saveUserItems();



// Reset form and filters so the new item is visible
itemForm.reset();
setDateDefaults();
searchInput.value = "";
navSearchInput.value = "";
typeFilter.value = "All";
categoryFilter.value = "All";

renderItems();

showMessage("✓ Report successfully saved to Supabase!", false);
});


/* ---------- Start ---------- */
setDateDefaults();
renderItems();
loadDatabaseItems();


/* ---------- Findr Notifications ---------- */

const notificationBell =
    document.getElementById("notificationBell");

const notificationCount =
    document.getElementById("notificationCount");

const notificationPanel =
    document.getElementById("notificationPanel");

const notificationList =
    document.getElementById("notificationList");

const seenNotificationKey = "findr-seen-notifications";

let findrNotifications = [];

let seenNotificationIds;

try {
    seenNotificationIds = new Set(
        JSON.parse(
            localStorage.getItem(seenNotificationKey) || "[]"
        ).map(String)
    );
} catch {
    seenNotificationIds = new Set();
}

function renderFindrNotifications() {
    if (!notificationList || !notificationCount) return;

    const unread = findrNotifications.filter(
        notification =>
            !seenNotificationIds.has(String(notification.id))
    ).length;

    notificationCount.textContent = unread > 99 ? "99+" : String(unread);
notificationCount.hidden = unread === 0;

    notificationList.replaceChildren();

    if (findrNotifications.length === 0) {
        notificationList.textContent = "No notifications yet.";
        return;
    }

    findrNotifications.forEach(notification => {
        const card = document.createElement("div");
        card.className = "notification-item";

        const title = document.createElement("strong");
        title.textContent = notification.title;

        const message = document.createElement("p");
        message.textContent = notification.message;

        const date = document.createElement("small");
        date.textContent = new Date(
            notification.created_at
        ).toLocaleString();

        card.append(title, message, date);
        notificationList.appendChild(card);
    });
}

async function loadFindrNotifications() {
    const { data, error } = await supabaseClient
        .from("notifications")
        .select("id, title, message, item_id, created_at")
        .order("created_at", { ascending: false })
        .limit(50);

    if (error) {
        console.error(
            "Notification loading error:",
            error.message
        );

        if (notificationList) {
            notificationList.textContent =
                "Notifications load nahi ho paayi.";
        }
        return;
    }

    findrNotifications = data || [];
    renderFindrNotifications();
}


if (notificationBell && notificationPanel) {
    notificationBell.addEventListener("click", () => {
        const isOpening = notificationPanel.hidden;

        notificationPanel.hidden = !isOpening;
        notificationBell.setAttribute("aria-expanded", String(isOpening));

        if (isOpening) {
            findrNotifications.forEach(notification => {
                seenNotificationIds.add(String(notification.id));
            });

            localStorage.setItem(
                seenNotificationKey,
                JSON.stringify([...seenNotificationIds].slice(-500))
            );

            renderFindrNotifications();
        }
    });

    document.addEventListener("click", event => {
        if (!event.target.closest(".notification-wrapper")) {
            notificationPanel.hidden = true;
            notificationBell.setAttribute("aria-expanded", "false");
        }
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            notificationPanel.hidden = true;
            notificationBell.setAttribute("aria-expanded", "false");
        }
    });
}


// Live updates while the website is open
const findrNotificationChannel = supabaseClient
    .channel("findr-live-notifications")
    .on(
        "postgres_changes",
        {
            event: "INSERT",
            schema: "public",
            table: "notifications"
        },
        payload => {
            const newNotification = payload.new;

            findrNotifications = [
                newNotification,
                ...findrNotifications.filter(
                    item =>
                        String(item.id) !==
                        String(newNotification.id)
                )
            ].slice(0, 50);

            renderFindrNotifications();
        }
    )
    .subscribe(status => {
        if (status === "SUBSCRIBED") {
            loadFindrNotifications();
        }
    });

// Load existing notifications on startup
loadFindrNotifications();




/* ---------- Submit claim request ---------- */
claimForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const itemId = claimItemId.value;
    const name = claimantName.value.trim();
    const email = claimantEmail.value.trim();
    const message = claimMessageInput.value.trim();

    if (!itemId || !name || !email || message.length < 5) {
        claimMessageStatus.textContent =
            "Please fill in all fields correctly.";
        return;
    }

    const submitButton = claimForm.querySelector(
        'button[type="submit"]'
    );

    submitButton.disabled = true;
    claimMessageStatus.textContent = "Sending claim request...";

    try {
        const { error } = await supabaseClient
            .from("claims")
            .insert({
                item_id: itemId,
                claimant_name: name,
                claimant_email: email,
                message: message
            });

        if (error) {
            console.error("Claim submission error:", error.message);
            claimMessageStatus.textContent =
                "Claim submit nahi hua. Please try again.";
            return;
        }

        claimForm.reset();
        claimItemId.value = itemId;

        claimMessageStatus.textContent =
            "✓ Claim request submitted successfully!";
    } catch (error) {
        console.error(error);
        claimMessageStatus.textContent =
            "Network error. Please try again.";
    } finally {
        submitButton.disabled = false;
    }
});



/* ---------- Findr Push Notification ON/OFF ---------- */

const PUSH_VAPID_PUBLIC_KEY =
    "BG8QUrjelZV5lnOOGSMKK84-DZo0FL6_ribWS2NAfHnc2JwqMJiuH2EpHwzHe1DCtXeCnumHf6bT8-3B6HJZ0eY";

const PUSH_SUBSCRIBE_URL =
    `${SUPABASE_URL}/functions/v1/push-subscribe`;

const pushToggle = document.getElementById("enablePushBtn");
const pushStatus = document.getElementById("pushStatus");

let pushBusy = false;

function updatePushUI(enabled, message) {
    if (!pushToggle || !pushStatus) return;

    pushToggle.classList.toggle("is-enabled", enabled);
    pushToggle.setAttribute("aria-checked", String(enabled));
    pushToggle.setAttribute(
        "aria-label",
        enabled
            ? "Turn push notifications off"
            : "Turn push notifications on"
    );

    pushStatus.textContent =
        message ||
        (enabled ? "Notifications are ON" : "Notifications are OFF");
}

function urlBase64ToUint8Array(value) {
    const padding = "=".repeat((4 - value.length % 4) % 4);
    const base64 = (value + padding)
        .replace(/-/g, "+")
        .replace(/_/g, "/");

    return Uint8Array.from(
        atob(base64),
        character => character.charCodeAt(0)
    );
}

async function getPushRegistration() {
    if (!("serviceWorker" in navigator)) return null;

    return await navigator.serviceWorker.getRegistration();
}

async function getFindrPushSubscription() {
    if (!("PushManager" in window)) return null;

    const registration = await getPushRegistration();

    if (!registration) return null;

    return await registration.pushManager.getSubscription();
}

async function turnPushOn() {
    if (!window.isSecureContext) {
        throw new Error("Findr ko HTTPS par open karo.");
    }

    if (
        !("serviceWorker" in navigator) ||
        !("PushManager" in window) ||
        !("Notification" in window)
    ) {
        throw new Error(
            "Is browser mein push notifications supported nahi hain."
        );
    }

    if (Notification.permission === "denied") {
        throw new Error(
            "Browser settings mein Findr notifications allow karo."
        );
    }

    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
        throw new Error("Browser notification permission allow nahi hui.");
    }

    const registration = await navigator.serviceWorker.register(
        new URL("./service-worker.js", document.baseURI)
    );

    await navigator.serviceWorker.ready;

    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
        subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey:
                urlBase64ToUint8Array(PUSH_VAPID_PUBLIC_KEY)
        });
    }

    try {
        const response = await fetch(PUSH_SUBSCRIBE_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(subscription.toJSON())
        });

        if (!response.ok) {
            const detail = await response.text();
            console.error("Push subscribe response:", detail);

            throw new Error(
                `Server subscription save nahi hui (HTTP ${response.status}).`
            );
        }
    } catch (error) {
        /*
         * Don't automatically unsubscribe here:
         * an existing subscription may have been valid already,
         * and a network error doesn't prove the server didn't save it.
         */
        throw error;
    }

    updatePushUI(true, "Notifications are ON");
}

async function turnPushOff() {
    const subscription = await getFindrPushSubscription();

    if (subscription) {
        const removed = await subscription.unsubscribe();

        if (!removed) {
            throw new Error("Notifications OFF nahi hui. Dobara try karo.");
        }
    }

    updatePushUI(false, "Notifications are OFF");
}

async function handlePushToggle() {
    if (pushBusy || !pushToggle || !pushStatus) return;

    pushBusy = true;
    pushToggle.disabled = true;
    pushStatus.textContent = "Updating notification settings...";

    try {
        const enabled =
            pushToggle.getAttribute("aria-checked") === "true";

        if (enabled) {
            await turnPushOff();
        } else {
            await turnPushOn();
        }
    } catch (error) {
        console.error("Findr push notification error:", error);

        let enabled = false;

        try {
            const subscription = await getFindrPushSubscription();
            enabled = Boolean(
                subscription &&
                "Notification" in window &&
                Notification.permission === "granted"
            );
        } catch (statusError) {
            console.error("Could not check push status:", statusError);
        }

        updatePushUI(
            enabled,
            error.message || "Notification setting update nahi hui."
        );
    } finally {
        pushBusy = false;
        pushToggle.disabled = false;
    }
}

async function initialisePushToggle() {
    if (!pushToggle || !pushStatus) return;

    updatePushUI(false, "Checking status...");

    try {
        if (
            !("Notification" in window) ||
            !("PushManager" in window) ||
            !("serviceWorker" in navigator)
        ) {
            pushToggle.disabled = true;
            updatePushUI(false, "Push notifications unsupported");
            return;
        }

        const subscription = await getFindrPushSubscription();
        const enabled = Boolean(
            subscription && Notification.permission === "granted"
        );

        updatePushUI(
            enabled,
            enabled ? "Notifications are ON" : "Notifications are OFF"
        );
    } catch (error) {
        console.error("Could not check push status:", error);
        updatePushUI(false, "Notification status unavailable");
    }
}

if (pushToggle && pushStatus) {
    pushToggle.addEventListener("click", handlePushToggle);
    initialisePushToggle();
}

/* ---------- First-visit notification welcome popup ---------- */
(function setupPushWelcomePopup() {
    const DISMISSED_KEY = "findr-push-welcome-dismissed";

    // Required existing controls must be available.
    if (!pushToggle || !pushStatus) return;

    // Create popup styles.
    const style = document.createElement("style");
    style.textContent = `
        .findr-welcome-overlay {
            position: fixed;
            inset: 0;
            z-index: 99999;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            background: rgba(12, 24, 18, 0.58);
            backdrop-filter: blur(5px);
        }

        .findr-welcome-overlay[hidden] {
            display: none;
        }

        .findr-welcome-card {
            width: 100%;
            max-width: 390px;
            padding: 30px 24px;
            border-radius: 22px;
            background: #fff;
            color: #18251d;
            text-align: center;
            box-shadow: 0 24px 70px rgba(0, 0, 0, 0.22);
            font-family: inherit;
            animation: findrWelcomeIn 0.22s ease-out;
        }

        .findr-welcome-icon {
            display: grid;
            place-items: center;
            width: 64px;
            height: 64px;
            margin: 0 auto 18px;
            border-radius: 20px;
            background: #e7f4e9;
            font-size: 30px;
        }

        .findr-welcome-card h2 {
            margin: 0 0 10px;
            font-size: 25px;
            line-height: 1.25;
        }

        .findr-welcome-card p {
            margin: 0 0 22px;
            color: #657168;
            font-size: 15px;
            line-height: 1.6;
        }

        .findr-welcome-enable,
        .findr-welcome-later {
            width: 100%;
            min-height: 46px;
            border-radius: 12px;
            font: inherit;
            font-weight: 600;
            cursor: pointer;
        }

        .findr-welcome-enable {
            border: 0;
            background: #246b45;
            color: #fff;
        }

        .findr-welcome-enable:hover {
            background: #1b5536;
        }

        .findr-welcome-enable:disabled {
            cursor: wait;
            opacity: 0.7;
        }

        .findr-welcome-later {
            margin-top: 10px;
            border: 1px solid #e1e8e2;
            background: #fff;
            color: #46534a;
        }

        .findr-welcome-status {
            margin-top: 12px !important;
            margin-bottom: 0 !important;
            font-size: 13px !important;
        }

        @keyframes findrWelcomeIn {
            from {
                opacity: 0;
                transform: translateY(10px) scale(0.98);
            }
            to {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
        }

        @media (prefers-reduced-motion: reduce) {
            .findr-welcome-card {
                animation: none;
            }
        }
    `;
    document.head.appendChild(style);

    // Build popup without changing your existing HTML.
    const overlay = document.createElement("div");
    overlay.className = "findr-welcome-overlay";
    overlay.hidden = true;

    overlay.innerHTML = `
        <section
            class="findr-welcome-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="findrWelcomeTitle"
            aria-describedby="findrWelcomeDescription"
        >
            <div class="findr-welcome-icon" aria-hidden="true">🔔</div>
            <h2 id="findrWelcomeTitle">Stay in the loop</h2>
            <p id="findrWelcomeDescription">
                Get notified about campus lost and found updates,
                so you don't miss important item alerts.
            </p>
            <button type="button" class="findr-welcome-enable">
                Enable notifications
            </button>
            <button type="button" class="findr-welcome-later">
                Maybe later
            </button>
            <p class="findr-welcome-status" role="status" hidden></p>
        </section>
    `;

    document.body.appendChild(overlay);

    const enableButton = overlay.querySelector(".findr-welcome-enable");
    const laterButton = overlay.querySelector(".findr-welcome-later");
    const statusText = overlay.querySelector(".findr-welcome-status");

    function closePopup() {
        overlay.hidden = true;
    }

    
laterButton.addEventListener("click", function () {
    closePopup();
});

    enableButton.addEventListener("click", async function () {
        enableButton.disabled = true;
        statusText.hidden = false;
        statusText.textContent = "Setting up notifications...";

        try {
            // Reuse Findr's existing notification subscription flow.
            await handlePushToggle();

            const enabled =
                pushToggle.getAttribute("aria-checked") === "true";

            if (enabled) {
                try {
                    localStorage.setItem(DISMISSED_KEY, "yes");
                } catch (error) {
                    console.warn("Could not save popup preference.", error);
                }
                closePopup();
            } else {
                statusText.textContent =
                    pushStatus.textContent ||
                    "Notifications could not be enabled. Please try again.";
            }
        } catch (error) {
            console.error("Welcome popup notification error:", error);
            statusText.textContent =
                "Could not enable notifications. Please try again.";
        } finally {
            enableButton.disabled = false;
        }
    });

    // Show only on a first visit when permission is still undecided
    // and no active push subscription exists.
    
async function maybeShowPopup() {
    console.log("Findr popup: checking conditions...");

    try {
        console.log("Notification supported:", "Notification" in window);
        console.log("Service worker supported:", "serviceWorker" in navigator);
        console.log("Push supported:", "PushManager" in window);
        console.log("Secure context:", window.isSecureContext);
        console.log("Permission:", Notification.permission);
        console.log("Popup element exists:", !!overlay);

        if (
            !("Notification" in window) ||
            !("serviceWorker" in navigator) ||
            !("PushManager" in window) ||
            !window.isSecureContext
        ) {
            console.log("Popup blocked: browser support or secure context.");
            return;
        }

        if (Notification.permission !== "default") {
            console.log("Popup skipped: permission is", Notification.permission);
            return;
        }

        const subscription = await getFindrPushSubscription();
        console.log("Existing subscription:", !!subscription);

        if (subscription) {
            console.log("Popup skipped: subscription already exists.");
            return;
        }

        overlay.hidden = false;
        console.log("Findr popup: SHOWING");
    } catch (error) {
        console.error("Findr popup check failed:", error);
    }
}

window.setTimeout(maybeShowPopup, 900);
