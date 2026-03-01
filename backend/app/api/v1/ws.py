"""WebSocket — real-time device and event updates."""
import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter(tags=["websocket"])
# In production: use Redis pub/sub or similar for multi-instance
connections: list[WebSocket] = []


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket) -> None:
    await websocket.accept()
    connections.append(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Echo or broadcast; in real app, validate token and broadcast to user's room
            try:
                msg = json.loads(data)
                msg["broadcast"] = True
                for conn in connections:
                    if conn != websocket:
                        await conn.send_text(json.dumps(msg))
            except json.JSONDecodeError:
                await websocket.send_text(json.dumps({"error": "Invalid JSON"}))
    except WebSocketDisconnect:
        pass
    finally:
        if websocket in connections:
            connections.remove(websocket)


def broadcast_message(payload: dict) -> None:
    """Call from event ingest to push real-time updates (use asyncio in real code)."""
    import asyncio
    msg = json.dumps(payload)
    for ws in connections:
        try:
            asyncio.create_task(ws.send_text(msg))
        except Exception:
            pass
