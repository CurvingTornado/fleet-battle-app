# Changelog

## [2.4.0] - 2026-05-09

### Added
- **Tactical UI:** Implemented a premium "Tactical Command" visual system with brass accents, glassmorphism, and a global grid overlay for enhanced immersion.
- **Animations:** Added gold header shimmer and status pulse effects for refined visual feedback.

### Changed
- **Architecture:** Major refactor of frontend state management. Extracted logic from `App.jsx` into the React Context API and specialized custom hooks (`useTacticalHandlers`).
- **Modularity:** Extracted UI elements into dedicated components (`TacticalHeader`, `TacticalLayout`, `TacticalDashboard`) to improve maintainability and architectural clarity.
- **Sub-tabs:** Complete overhaul of **Roster**, **Assignment**, and **Formation** tabs with modern CSS patterns and improved UX for fleet coordination.

## [2.3.1] - 2026-05-09

### Fixed
- **Server Initialization:** Hotfixed `.env` path resolution. `dotenv` now explicitly uses an absolute path (`path.join(__dirname, '.env')`). This prevents silent failures (such as the Discord bot silently aborting and CORS blocking connections) when the server is started from a parent directory instead of the `server/` folder directly.
- **UI/UX:** Updated the connection status indicator from amber to green for better clarity.



## [2.3.0] - 2026-05-09

### Fixed
- **Server:** Resolved a critical race condition where environment variables (`.env`) were loaded after Socket.io initialization, causing CORS issues and connection failures on non-local environments.
- **Discord Bot:** Fixed an issue where the bot failed to find active lobbies by improving synchronization between the `LobbyManager` and the Discord interaction handler.

### Added
- **Logging:** Implemented diagnostic warnings for room lookups. When a room is not found, the server now logs all currently active room IDs to assist with debugging.
- **Data Persistence:** `LobbyManager` now persists the Commander's human-readable name in addition to their unique ID.
- **Discord Bot:** The `/link_lobby` embed now displays the Commander's name for better clarity.

### Changed
- **Architecture:** Standardized environment variable loading to occur at the absolute entry point of the server.
