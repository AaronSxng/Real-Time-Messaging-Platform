from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from sqlalchemy import select
from database import AsyncSessionLocal
from models.messages import Message
from models.user import User
from routers.network_log import log_network_event
from jose import jwt, JWTError
import os
import time


SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"

router = APIRouter()

active_connections: dict[int, list[WebSocket]] = {}


async def broadcast(conversation_id: int, message: dict):
    connections = active_connections.get(conversation_id, [])
    for connection in connections:
        await connection.send_json(message)


@router.websocket("/ws/{conversation_id}")
async def websocket_endpoint(websocket: WebSocket, conversation_id: int, token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if not username:
            await websocket.close(code=1008)
            return
    except JWTError:
        await websocket.close(code=1008)
        return

    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.username == username))
        user = result.scalar_one_or_none()
        if not user:
            await websocket.close(code=1008)
            return
        user_id = user.id

    await websocket.accept()

    if conversation_id not in active_connections:
        active_connections[conversation_id] = []
    active_connections[conversation_id].append(websocket)

    try:
        while True:
            data = await websocket.receive_json()
            start_time = time.time()

            async with AsyncSessionLocal() as db:
                message = Message(
                    conversation_id=conversation_id,
                    sender_id=user_id,
                    content=data["content"],
                )
                db.add(message)
                await db.commit()

            src_ip, src_port = websocket.client
            async with AsyncSessionLocal() as db:
                await log_network_event(
                    db=db,
                    src_ip=src_ip,
                    src_port=src_port,
                    start_time=start_time,
                    protocol="WS",
                    dst_port=8000
                )

            await broadcast(conversation_id, {
                "sender_id": user_id,
                "content": data["content"],
                "conversation_id": conversation_id,
                "sent_by": username,
                "full_name": f"{user.first_name} {user.last_name}"
            })

    except WebSocketDisconnect:
        active_connections[conversation_id].remove(websocket)
