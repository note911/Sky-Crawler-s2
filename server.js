const http = require('node:http');
const { WebSocketServer, WebSocket } = require('ws');
const crypto = require('node:crypto');

const PORT = process.env.PORT || 10000;
const MAX_PLAYERS = 10;
const rooms = new Map();
const path = require('node:path');
const fs = require('node:fs');

const GAME_FILE = path.join(__dirname, 'index.html');
const server = http.createServer((req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;

  if (pathname === '/healthz') {
    res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
    return res.end(JSON.stringify({ ok: true, service: 'car-garage-multiplayer', rooms: rooms.size }));
  }

  if (pathname === '/' || pathname === '/index.html') {
    fs.readFile(GAME_FILE, (err, html) => {
      if (err) {
        res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' });
        return res.end('Game page is missing. Make sure index.html is in the project root.');
      }
      res.writeHead(200, {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'no-cache'
      });
      res.end(html);
    });
    return;
  }

  res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
  res.end('Not found');
});
const wss = new WebSocketServer({ server, maxPayload: 8192 });
const safeRoom = value => String(value || 'garage1').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 20) || 'garage1';
const safeName = v => String(v || 'Driver').replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, 16) || 'Driver';
const send = (ws, data) => { if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(data)); };
function broadcast(room, data, except) {
  for (const client of room.clients) if (client !== except) send(client, data);
}
function publicPlayer(p) {
  return { id:p.id, name:p.name, mode:p.mode, x:p.x, z:p.z, h:p.h, v:p.v, cfg:p.cfg };
}
wss.on('connection', ws => {
  ws.player = null;
  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });
  ws.on('error', () => {});
  ws.on('message', raw => {
    let msg; try { msg = JSON.parse(raw.toString()); } catch { return; }
    if (!msg || typeof msg !== 'object') return;
    if (msg.type === 'join') {
      if (ws.player) return;
      const roomName = safeRoom(msg.room);
      let room = rooms.get(roomName);
      if (!room) { room = { clients:new Set() }; rooms.set(roomName, room); }
      if (room.clients.size >= MAX_PLAYERS) { send(ws, { type:'error', message:'Room is full (10 players maximum).' }); return ws.close(); }
      const player = { id:crypto.randomUUID(), name:safeName(msg.name), mode:'build', x:90, z:0, h:0, v:0, cfg:{body:0,wheel:1,spoiler:0,cyl:0,ind:0,tune:1,glow:1,color:'#2e86e4'} };
      ws.player = player; ws.roomName = roomName; ws.room = room; room.clients.add(ws);
      const existing = [...room.clients].filter(c=>c!==ws).map(c=>publicPlayer(c.player));
      send(ws, { type:'welcome', id:player.id, players:existing, count:room.clients.size });
      broadcast(room, { type:'state', player:publicPlayer(player), count:room.clients.size }, ws);
      return;
    }
    if (msg.type === 'state' && ws.player && ws.room) {
      const p = msg.player || {};
      for (const key of ['x','z','h','v']) if (!Number.isFinite(p[key])) return;
      if (Math.abs(p.x)>1e7 || Math.abs(p.z)>1e7 || Math.abs(p.v)>5000) return;
      const cfg = p.cfg && typeof p.cfg === 'object' ? p.cfg : ws.player.cfg;
      const color = /^#[0-9a-fA-F]{6}$/.test(cfg.color) ? cfg.color : '#2e86e4';
      ws.player = { ...ws.player, name:safeName(p.name || ws.player.name), mode:p.mode === 'build' ? 'build' : 'race', x:p.x, z:p.z, h:p.h, v:p.v,
        cfg:{ body:clampInt(cfg.body,0,2), wheel:clampInt(cfg.wheel,0,2), spoiler:clampInt(cfg.spoiler,0,2), cyl:clampInt(cfg.cyl,0,3), ind:clampInt(cfg.ind,0,4), tune:clampInt(cfg.tune,0,2), glow:clampInt(cfg.glow,0,4), color } };
      broadcast(ws.room, { type:'state', player:publicPlayer(ws.player), count:ws.room.clients.size }, ws);
    }
  });
  ws.on('close', () => {
    if (!ws.room || !ws.player) return;
    const room = ws.room; room.clients.delete(ws);
    broadcast(room, { type:'leave', id:ws.player.id, count:room.clients.size });
    if (room.clients.size === 0) rooms.delete(ws.roomName);
  });
});
setInterval(() => { for (const c of wss.clients) { if (!c.isAlive) { c.terminate(); continue; } c.isAlive = false; try { c.ping(); } catch {} } }, 30000);
function clampInt(v,min,max) { return Number.isInteger(v) ? Math.max(min,Math.min(max,v)) : min; }
server.listen(PORT, '0.0.0.0', () => console.log(`Car Garage multiplayer server listening on ${PORT}`));
