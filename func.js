import { ServerData } from "./constructor.js";

export function broadcast(room, requestID, data)
{
    room.forEach(ws => {
        ws.send(JSON.stringify(new ServerData(parseInt(requestID), data)));
    });
}

export function broadcast_other(room, requestID, data, exclude_ws)
{
    room.forEach(ws => {
        if (ws != exclude_ws)
            ws.send(JSON.stringify(new ServerData(parseInt(requestID), data)));
    });
}