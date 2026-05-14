from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import AsyncSessionLocal, get_db
from models.messages import Message
import json

router = APIRouter(prefix="/ws", tags=["websocket"])

active_connections: dict[int, list[WebSocket]] = {}

async def broadcast(conversation_id: int, message: dict):
    connections = active_connections.get(conversation_id, [])
    for connection in connections:
        await connection.send_json(message)

@router.websocket("/ws/{conversation_id}")
async def websocket_endpoint(websocket: WebSocket, conversation_id: int):
    await websocket.accept()
    if conversation_id not in active_connections:
        active_connections[conversation_id] = []
    active_connections[conversation_id].append(websocket)

    try:
        while True:
            data = await websocket.receive_text()

            async with AsyncSessionLocal() as db:
                message = Message(
                    conversation_id=conversation_id,
                    sender_id=data["sender_id"],
                    content=data["content"]
                )
                db.add(message)
                await db.commit()
            
            await broadcast(conversation_id, {
                "sender_id": data["sender_id"],
                "content": data["content"],
                "conversation_id": conversation_id,
            })
    
    except WebSocketDisconnect:
        active_connections[conversation_id].remove(websocket)