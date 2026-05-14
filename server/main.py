from fastapi import FastAPI, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from database import get_db, engine
from models.base import Base
import models.user, models.conversation, models.conversationMember, models.messages
from routers.auth import router as auth_router

app = FastAPI()
app.include_router(auth_router)


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