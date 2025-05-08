import { WebSocketServer } from 'ws';
import dotenv from 'dotenv';
import { ServerData } from './constructor.js';
import crypto from 'crypto';
import { broadcast, broadcast_other } from './func.js';
import { game_generate_roomID, game_generate_text } from './game_func.js';
import { exit } from 'process';

dotenv.config();

const wss = new WebSocketServer({ port: 3030 });

const rooms = new Map();
const menuPlayers = new Map();

let nbReqRec = 0;
let nbReqEnv = 0;

console.log("Serveur WebSocket démarré sur le port 3030");

wss.on('connection', (ws) => {

    const ID = crypto.randomUUID();
    ws.stats = {
        ID: ID,
        roomID: -1,
        name : "",
        gameTextI: 1,
        gameText: ""
    };
    menuPlayers.set(ID, ws);
    ws.send(JSON.stringify(new ServerData(process.env.REQ_UNIQUEID, { ID })));
    console.log("Client connecté au menu !")

    ws.on('message', async (res) => {
        try {
            nbReqRec++;
            const bufferString = res.toString('utf8').replace(/\0/g, '').trim();
            const buffer = JSON.parse(bufferString);
            
            switch (buffer.requestID) {
                case parseInt(process.env.REQ_CREATE):
                    const roomID = game_generate_roomID();
                    const roomData = [];
                    
                    rooms.set(roomID, new Map());
                    rooms.get(roomID).set("players", new Map());
                    rooms.get(roomID).set("gameText", await game_generate_text(100, "macron"));
                    rooms.get(roomID).set("gameStarted", false);

                    ws.stats.roomID = roomID;

                    rooms.get(roomID).get("players").set(ws.stats.ID, ws);
                    menuPlayers.delete(ws.stats.ID);

                    for (const [id, ws] of rooms.get(roomID).get("players"))
                        roomData.push({ stats: ws.stats });

                    ws.send(JSON.stringify(new ServerData(process.env.REQ_JOIN, { roomID: roomID, room: roomData, gameText: rooms.get(roomID).get("gameText") })));

                    console.log("Room créée : " + roomID);
                    break;
                case parseInt(process.env.REQ_JOIN):
                    var clientRoomID = buffer.data.roomID;

                    if (rooms.has(clientRoomID) && !rooms.get(clientRoomID).get("gameStarted"))
                    {
                        const roomData = [];
                        ws.stats.roomID = clientRoomID;
                        rooms.get(clientRoomID).get("players").set(ws.stats.ID, ws);
                        menuPlayers.delete(ws.stats.ID);

                        for (const [id, ws] of rooms.get(clientRoomID).get("players"))
                            roomData.push({ stats: ws.stats });
    
                        broadcast(rooms.get(clientRoomID).get("players"), process.env.REQ_JOIN, { roomID : clientRoomID, room: roomData, gameText: rooms.get(clientRoomID).get("gameText") })
    
                        console.log("Room rejointe : " + clientRoomID);
                    }
                    break;
                case parseInt(process.env.REQ_START):
                    var clientRoomID = buffer.data.roomID;
                    var room = rooms.get(clientRoomID);
                    broadcast(room.get("players"), process.env.REQ_START, rooms.has(clientRoomID));
                    room.set("gameStarted", true);
                    console.log("Room lancée : " + clientRoomID);

                    setInterval(() => {
                        var playerInfos = [];
                        room.get("players").forEach(player => {
                            playerInfos.push({ ID: player.stats.ID, gameTextI: player.stats.gameTextI });
                            nbReqEnv++
                        });
                        broadcast(room.get("players"), process.env.REQ_SYNC, playerInfos);
                    }, 100)
                    break;
                case parseInt(process.env.REQ_INPUT):
                    var room = rooms.get(ws.stats.roomID);
                    console.log(room.get("gameText")[ws.stats.gameTextI - 1]);
                    if (room.get("gameText")[ws.stats.gameTextI - 1] === buffer.data.input) {
                        ws.stats.gameTextI++;
                        console.log("Bon input !");
                        ws.send(JSON.stringify(new ServerData(process.env.REQ_INPUT, true)));
                        nbReqEnv++;
                    }
                    else
                    {
                        console.log("Mauvais input !");
                        ws.send(JSON.stringify(new ServerData(process.env.REQ_INPUT, ws.stats)));
                        nbReqEnv++;
                    }
                    break;
                
            }
        } catch (err) {
            console.error('Erreur de parsing Buffer/JSON : ', err.message);
        }
    })

    ws.on('close', () => {
        menuPlayers.delete(ws.stats.ID);
    
        for (const [roomID, room] of rooms.entries()) {
            const players = room.get("players");
            
            if (players.has(ws.stats.ID)) {
                players.delete(ws.stats.ID);
                broadcast(players, process.env.REQ_DISCONNECT, ws.stats.ID);
    
                if (players.size === 0) {
                    rooms.delete(roomID);
                    console.log(`Room ${roomID} supprimée car vide.`);
                }
    
                break;
            }
        }
    
        console.log("Joueur déconnecté");
    });
});



setInterval(() => {
    console.log(`Reçu : ${nbReqRec} - Envoyé : ${nbReqEnv}`);
    nbReqRec = 0;
    nbReqEnv = 0;
}, 1000)

/*

    ws.stats = {
        ID: crypto.randomUUID(),
        gameTextI: 1,
        gameText: gameText
    }

    ws.send(JSON.stringify(new ServerData(parseInt(process.env.REQ_UNIQUEID), ws.stats)));

    players.forEach((player) => {
        player.send(JSON.stringify(new ServerData(parseInt(process.env.REQ_JOIN), players)));
    });



    
*/