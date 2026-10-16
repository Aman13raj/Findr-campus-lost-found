# Findr | Campus Lost & Found Portal

A responsive web portal where students can report lost or found items on campus, browse recent reports, and search or filter them. Built as a college mini project.

**Live demo:** _add your GitHub Pages link here_
**Screenshot:** _add a screenshot here, e.g. `![Findr home page](assets/screenshot.png)`_

---

## Features

- Browse recently reported items as cards with photo, category, location and date
- Live search by item name, category, location or description
- Filter by report type (Lost / Found) and by category; all filters work together
- "Read More" opens a details popup with the full description and pickup safety note
- Report form to add a lost or found item, with optional photo upload
- Form validation (required fields, no future dates, photo type and size check)
- Pickup guidelines section for safe handover of belongings
- Fully responsive layout (desktop, tablet, mobile)

## Tech Stack

| Part | Technology |
| --- | --- |
| Structure | HTML5 |
| Styling | CSS3 (Grid, Flexbox, custom properties) |
| Logic | Vanilla JavaScript (ES6) |
| Storage (v1) | Browser `localStorage` |
| Backend (v2) | Python, Flask, SQLite |

## Project Versions

### v1: Frontend only (this folder)

Everything runs in the browser. New reports are stored in `localStorage`, so they are visible only on the same device and browser.

```
.
├── index.html
├── style.css
├── script.js
└── assets/
```

**Run it:** open `index.html` in a browser (or use the VS Code Live Server extension).

### v2: Flask backend (`findr-flask/`)

Reports are saved in a SQLite database and shared by everyone using the server. Photos are uploaded to the server.

```
findr-flask/
├── app.py
├── requirements.txt
└── static/
    ├── index.html
    ├── style.css
    ├── script.js
    └── assets/
```

**Run it:**

```bash
cd findr-flask
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS / Linux
pip install -r requirements.txt
python app.py
```

Then open <http://127.0.0.1:5000>.

#### API

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | `/api/items` | List items. Optional query params: `q`, `type`, `category` |
| POST | `/api/items` | Create an item (`multipart/form-data`, optional `itemImage` file) |

## What I Learned

- Building a multi-section responsive layout with CSS Grid and Flexbox
- Manipulating the DOM with JavaScript and handling events with delegation
- Combining several filters in one function
- Validating user input on both client and server
- Preventing XSS by using `textContent` instead of `innerHTML`
- Building a REST API with Flask and storing data in SQLite with parameterised queries

## Future Improvements

- User login (students / admin)
- Mark an item as "Claimed" and let the owner delete their own report
- Email or notification when a matching item is reported
- Deploy the backend (e.g. Render) so the portal is accessible online

## Author

**Aman**, Computer Science Engineering student
GitHub: _add your profile link_ · LinkedIn: _add your profile link_

## License

This project is for educational purposes.
