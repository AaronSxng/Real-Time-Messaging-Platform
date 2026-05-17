from time import time
from fastapi import FastAPI, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from database import AsyncSessionLocal, get_db, engine
from models.base import Base
import models.user, models.conversation, models.conversationMember, models.messages, models.network_log
from routers.auth import router as auth_router
from routers.websocket import router as websocket_router
from routers.messages import router as messages_router
from routers.network_log import log_network_event, router as network_log_router

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
    "http://localhost:5173",
    "https://real-time-messaging-platform-client.onrender.com",
],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Authentication routes
app.include_router(auth_router)

# WebSocket routes
app.include_router(websocket_router)

# Message and conversation routes
app.include_router(messages_router)

# Network log routes
app.include_router(network_log_router)

# Create tables on startup
@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

# Middleware to log all HTTP requests as network events
@app.middleware("http")
async def db_http_middleware(request, call_next):
    start_time = time()
    response = await call_next(request)
    src_ip = request.client.host
    src_port = request.client.port
    async with AsyncSessionLocal() as db:
        await log_network_event(
            db=db, 
            src_ip=src_ip, 
            src_port=src_port, 
            start_time=start_time, 
            protocol="HTTP",
            dst_port=8000
        )
    return response

# Basic health check endpoint
@app.get("/")
async def read_root():
    return {"Hello": "World"}

@app.get("/health")
async def read_health(db: AsyncSession = Depends(get_db)):
    await db.execute(text("SELECT 1"))
    return {"status": "ok"}