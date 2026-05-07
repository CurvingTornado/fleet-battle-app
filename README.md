# Guilliman's Fleet Command 🚢⚔️

**A real-time multiplayer tactical maritime command interface for coordinating fleets in *World of Sea Battles*.**

---

## 📌 Overview

Guilliman's Fleet Command is a **real-time collaborative tool** designed to help players of *World of Sea Battles* synchronize fleet strategies, assign squadrons, and visualize battle plans. Built with React and Socket.io, it enables seamless multiplayer coordination through an interactive map, dynamic roster management, and robust state persistence.

---

## 🛠️ Key Features

- **Real-Time Synchronized Roster & Squadron Assignment**  
  Coordinate fleet members and assign squadrons dynamically across all connected clients.

- **Interactive Tactical Whiteboard Map**  
  Draw battle formations, place markers, and visualize strategies on a shared map with real-time updates.

- **Sandbox Mode ("PLAYGROUND")**  
  Test scenarios offline without needing a server connection—ideal for solo planning or training.

- **Persistent State via Local JSON**  
  Data survives server crashes and reloads, ensuring no loss of progress during unexpected interruptions.

- **Automated Lobby Cleanup**  
  Inactive lobbies are automatically removed after **12/24 hours**, managed by precise timers in the `LobbyManager`.

---

## 🧱 Architecture

### Frontend
- **React (Vite)**: Fast, modern UI with component-based structure.
- **CSS**: Clean, responsive design for tactical map and controls.

### Backend
- **Node.js & Express**: Scalable API for handling game logic and authentication.
- **Socket.io**: Real-time communication between clients and server.

### Modular Design
- **Socket Handlers**:
  - `rosterHandler`: Manages player assignments and roles.
  - `squadronHandler`: Handles fleet structure and active formations.
  - `mapHandler`: Enables drawing, markers, and tactical map synchronization.
- **LobbyManager Class**: Centralized state management with timer-based automatic lobby cleanup.

---

## 🚀 Getting Started

### 🔧 Server Setup
1. Clone the repository and navigate to the server directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the server:
   ```bash
   node server.js
   ```

### 🖥️ Client Setup
1. Navigate to the client directory:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the client development server:
   ```bash
   npm run dev
   ```
4. Open `http://localhost:5173` in your browser.

---

## 🧪 Testing

We use **Vitest** for both frontend and backend unit testing to ensure reliability.

### ✅ Running Tests
- **Client Tests**:
  ```bash
  cd client
  npm test
  ```
- **Server Tests**:
  ```bash
  cd server
  npm test
  ```

---

**Guilliman's Fleet Command** — *Where strategy meets seamanship.* ⚓
