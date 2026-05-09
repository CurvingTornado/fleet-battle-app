# Changelog

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
