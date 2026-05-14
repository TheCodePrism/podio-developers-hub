# 🚀 Podio Developer Hub

<div align="center">
  <img src="./src/assets/logo.png" alt="Podio Hub Logo" width="150" style="border-radius: 20px;" />
  <br/><br/>
  <strong>A professional-grade, diagnostic-first developer suite for the Podio API.</strong>
  <br/>
  <em>Every module. Every edge case. One hub.</em>
  <br/><br/>

  ![Podio Hub](https://img.shields.io/badge/Podio-Developer%20Hub-6366f1?style=for-the-badge&logo=react)
  ![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)
  ![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
  ![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)
</div>

---

## 🧭 Overview

**Podio Developer Hub** transforms raw Podio API operations into a streamlined, visual, diagnostic-grade experience. Whether you're extracting data, bulk-updating thousands of items, inspecting schemas, or debugging webhooks — everything lives in one dark-mode power tool with context-aware logging and a floating terminal.

---

## ✨ Feature Highlights

### 🔐 Advanced Authentication
- **Multi-Method Support**: App Auth (ID + Token), User Auth (Username + Password), or full **OAuth2 flow**.
- **Live Connection Tester**: Validates credentials against the Podio API in real time.
- **OAuth2 Automation**: Detects and captures authorization codes from browser redirects automatically.
- **Secure by Design**: All credentials live only in `localStorage` — zero external servers involved.
- **Rate Limit Monitor**: A global interceptor reads `x-rate-limit-remaining` headers and displays a live health indicator in the top bar (🟢 / 🟡 / 🔴).

---

### 🛠 Power Tool Suite — 18 Modules

| Module | Description |
|---|---|
| **Dashboard** | Live overview of API activity, request history, error rates, and rate limit health |
| **Item Manager** | Create (POST) and update (PUT) Podio items with dynamic field mapping |
| **Item Inspector** | Deep-inspect any item: full field data, computed values, and revision history |
| **Revision Checker** | Fetch and browse revision history for any item |
| **Diff Tool** | Side-by-side comparison of item revisions with field-level change highlighting |
| **Comment Manager** | View, post, and manage comments across items |
| **Bulk Operations** | Execute large-scale item deletions or field updates with throttle control, auto-pause safety, and live progress |
| **View / Filter & Export** | ⭐ **Unified data extractor** — schema-aware filters, View ID targeting, sorting, field extraction, pagination, duplicate detection, and CSV/JSON export |
| **App Explorer** | Inspect an app's complete field schema, config, and metadata |
| **App Search** | Search for apps across spaces by name |
| **Space Browser** | Browse all spaces and their apps in an expandable tree view |
| **Space Mapper** | Visual relationship mapping of apps and spaces |
| **Webhook Manager** | List, create, and delete webhooks across apps |
| **File Uploader** | Upload files and attachments to Podio items |
| **Schema Builder** | Fetch, edit (via JSON editor), and redeploy Podio app schemas as Infrastructure as Code |
| **Code Generator** | Generate boilerplate API call snippets for common Podio operations |
| **Macro Engine** | Build and run multi-step API macro sequences |
| **Data Migrator** | Migrate item data between apps or spaces |
| **Network Inspector** | Live tracking of all outgoing Podio API requests — status, payload, headers, timing |

---

### 🔍 View / Filter & Export — Deep Dive

The unified **View / Filter & Export** module is the flagship tool, merging previously separate filtering and viewing tools into one:

- **Load Schema**: Fetches the app's field list for smart, type-aware inputs.
- **Smart Filter Rules**: Click "Smart Rule" to get auto-generated inputs per field type:
  - `date` → From/To date pickers
  - `number / money` → Min/Max range inputs
  - `category` → Inline multi-select checkbox pills
  - `text` → Text input with operator dropdown (Contains, Starts With, Is Set, etc.)
- **Manual Filter Rules**: Type any `external_id` directly — no schema required.
- **View ID**: Target a specific saved Podio view.
- **Sort**: Auto-complete from schema fields or type manually.
- **Extract Fields**: Click schema field pills to toggle extraction, or type any external ID manually. Selected fields appear as data rows under each result item.
- **Pagination**: "Load More" appends the next page without resetting results.
- **Duplicate Check**: Scans the loaded result set for any Item IDs that appear more than once.
- **Export**: Download results as **JSON** or **CSV** with a single click.

---

### 🖥 Floating Terminal Console

Every module ships with a **Floating Console** that replaces the static log panel:

- **Docked Mode** (default): Sits as a right-side panel within the module layout.
- **Float Mode**: Click **Undock** (📌 icon) to detach it into a free-floating window.
- **Drag**: Grab the title bar to move the console anywhere on screen.
- **8-Way Resize**: Drag any edge or corner to resize freely.
- **Minimize**: Collapse to just the title bar.
- **Re-Dock**: Click **Pin** to snap it back to its default panel position.

---

### ⚡ Diagnostic-First UX

- **Independent Module Logging**: Each module has an isolated `useModuleLogger` session — logs stay scoped and context-specific.
- **Command Palette (`Ctrl+K`)**: Fuzzy-search and instant navigation to any module.
- **Global Context Sharing**: Active `App ID` and `Space ID` are shared across all modules via React Context.
- **Tooltip Field Info**: Hovering over schema-based dropdowns and inputs reveals both the `field_id` and `external_id` for each field.

---

## 🎨 Design Philosophy

The Hub uses a **Glassmorphic Dark Mode** aesthetic optimised for long development sessions:

- **Vibrant Accent System**: Cyan/indigo-based color variables with semantic success/error/warning states.
- **Micro-Animations**: Smooth `fade-in`, `spin`, and transition effects throughout.
- **Monospace Terminal Aesthetic**: Log panels use JetBrains Mono / Fira Code for maximum readability.
- **Responsive Sidebar**: Grouped, icon-labelled navigation with an active-state indicator bar.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A Podio developer account with API credentials

### Installation

```bash
git clone https://github.com/TheCodePrism/podio-developers-hub.git
cd podio-developers-hub
npm install
npm run dev
```

### First-Time Setup

1. Click the **⚙ Credentials** button (bottom of sidebar).
2. Choose your auth method:
   - **App Auth** — recommended for app-specific scripts (fastest)
   - **User Auth** — for broad workspace exploration
   - **OAuth2** — for full authorization flows
3. Click **Test Connection** to validate your keys.
4. Press **`Ctrl+K`** to jump to any tool instantly.

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + Vite 5 |
| Icons | Lucide React |
| Styling | Vanilla CSS with Custom Property System |
| State | React Context + Custom Hooks (`usePodio`, `useModuleLogger`) |
| Auth | Multi-method Podio OAuth2 / App Auth / User Auth |
| Exports | Browser-native Blob API (CSV + JSON) |

---

## 📁 Project Structure

```
src/
├── assets/           # Logo and static assets
├── components/       # Shared components (Sidebar, Console, FloatingConsole, etc.)
├── context/          # PodioContext — global state, logging, auth
├── modules/          # All 18 tool modules
├── utils/            # Podio client, auth helpers
└── App.jsx           # Root router and layout
```

---

## 📄 License

MIT — built for developers who need more than just a sandbox.

---

*Made with 💙 by [TheCodePrism](https://github.com/TheCodePrism)*
