# Sky Crawler Multiplayer

This package contains your game, WebSocket server, Render configuration, and a Claude skill for maintaining the project.

## Run locally

1. Install Node.js.
2. Open a terminal in this folder.
3. Run `npm install`.
4. Run `npm start`.
5. Open `http://localhost:10000` in two browser tabs.
6. Open **Race friends** in each tab and enter the same room name.

## Deploy

Push these files to the root of your Git repository and deploy using `render.yaml`. The server serves the game and its WebSocket endpoint from the same host. The client automatically chooses `ws://` for HTTP and `wss://` for HTTPS.

## Claude skill

`SKILL.md` is the Claude skill definition. You can also upload this project ZIP to Claude when asking it to modify the game.

## Important

The existing multiplayer feature synchronizes player race/build status and distance for the room leaderboard. It does not yet render other players' cars directly inside the race scene.
