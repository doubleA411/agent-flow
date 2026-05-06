from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from collections import defaultdict
import asyncio

router = APIRouter()

connections: dict[str, list[WebSocket]] = defaultdict(list)

@router.websocket("/ws/runs/{run_id}")
async def run_updates(websocket: WebSocket, run_id: str):
    await websocket.accept()
    connections[run_id].append(websocket)
    try:
        while True:
            await asyncio.sleep(10)
    except WebSocketDisconnect:
        connections[run_id].remove(websocket)

@router.post("/internal/broadcast/{run_id}")
async def internal_broadcast(run_id: str, data: dict):
    dead = []
    for ws in connections.get(run_id, []):
        try:
            await ws.send_json(data)
        except Exception:
            dead.append(ws)
    for ws in dead:
        connections[run_id].remove(ws)
    return {"broadcasted": len(connections.get(run_id, []))}