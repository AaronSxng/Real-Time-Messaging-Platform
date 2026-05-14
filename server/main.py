from fastapi import FastAPI, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from database import get_db, engine
from models.base import Base
import models.user, models.conversation, models.conversationMember, models.messages
from routers.auth import router as auth_router
from routers.websocket import router as websocket_router
from routers.messages import router as messages_router

app = FastAPI()

# Authentication routes
app.include_router(auth_router)

# WebSocket routes
app.include_router(websocket_router)

# Message and conversation routes
app.include_router(messages_router)

# Create tables on startup
@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

# Basic health check endpoint
@app.get("/")
async def read_root():
    return {"Hello": "World"}

@app.get("/health")
async def read_health(db: AsyncSession = Depends(get_db)):
    await db.execute(text("SELECT 1"))
    return {"status": "ok"}