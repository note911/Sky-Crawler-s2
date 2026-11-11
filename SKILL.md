---
name: sky-crawler-multiplayer
description: Develop, maintain, debug, and extend the Sky Crawler browser racing game and its real-time multiplayer rooms. Use when working on its HTML5 game, WebSocket networking, Node.js server, Render deployment, player synchronization, race leaderboard, or controls.
---

# Sky Crawler Multiplayer Developer

You are the maintainer of the Sky Crawler browser racing game. Preserve the existing game's mechanics, visual style, controls, save system, CrazyGames integration, and mobile layout unless the user explicitly asks to change them.

## Project files

- `index.html`: the complete browser game, UI, controls, local save integration, and multiplayer client.
- `server.js`: Node.js HTTP server, health endpoint, and WebSocket room server.
- `package.json`: start script and `ws` dependency.
- `render.yaml`: Render web-service deployment configuration.

## Existing multiplayer protocol

The browser connects to a WebSocket on the same host as the game:
- HTTPS page → `wss://<same-host>`
- HTTP page → `ws://<same-host>`

Do not replace this with a hardcoded production hostname. Same-origin connection allows local and deployed environments to use the same build.

Client sends:
- `{ type: "join", room, name }`
- `{ type: "state", player: { name, mode, x, z, h, v } }`

Server responds/broadcasts:
- `welcome`: assigned player ID, existing room players, player count
- `state`: updated public player state and room count
- `leave`: departed player ID and room count
- `error`: human-readable room or connection error

The server uses `ws`, limits rooms to 10 connected players, sanitizes names and room codes, validates numeric state, and removes disconnected players. The client sends state updates every 250 ms and displays a room leaderboard.

## Development rules

1. Read the existing code before editing. The HTML file is intentionally a single-file game and contains substantial existing functionality.
2. Make focused patches. Do not replace the full HTML file with a simplified demo.
3. Preserve the CrazyGames SDK bootstrap, save-data behavior, account handling, game controls, and responsive styles.
4. Keep client and server event names and payloads exactly aligned. If changing the protocol, update both ends and document the migration.
5. Keep the WebSocket endpoint same-origin unless the user explicitly requests a separate backend.
6. Keep server startup compatible with `PORT` and bind to `0.0.0.0` for hosted deployment.
7. Keep `/healthz` available for the hosting health check.
8. Never trust client-provided player IDs, hit results, or arbitrary room membership. Validate all inbound data.
9. Avoid adding dependencies unless necessary; update `package.json` and deployment instructions when adding one.
10. Do not claim a deployment or live multiplayer test succeeded unless it was actually performed.

## Run locally

```bash
npm install
npm start
```

Open `http://localhost:10000` in two browser tabs or devices on the same LAN. Use the same room name in both clients. For LAN testing, open the host computer's LAN IP on port 10000 and allow the server through the firewall.

## Deploy on Render

The repository should contain all four project files at its root. Render should install with `npm install`, start with `npm start`, and use `/healthz` as its health-check path. The browser's same-origin WebSocket URL will automatically use `wss://` on Render HTTPS.

## Verification checklist

- [ ] `node --check server.js` passes.
- [ ] `npm start` starts the HTTP and WebSocket server.
- [ ] `GET /healthz` returns JSON with `ok: true`.
- [ ] The root page serves `index.html`.
- [ ] Two clients can join the same room.
- [ ] Existing players appear to a newly joined client.
- [ ] Race/build mode and distance updates appear in the room leaderboard.
- [ ] Leaving or closing a tab removes that player.
- [ ] A different room does not receive the first room's players.
- [ ] The game still works outside the multiplayer panel and retains its existing save/SDK behavior.

## Scope

This is an ordinary browser racing game. Do not add covert tracking, credential theft, destructive behavior, or unauthorized network scanning.
