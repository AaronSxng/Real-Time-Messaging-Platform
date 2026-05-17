import time
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import get_db
from models.network_log import NetworkLog
from routers.auth import get_current_user
from models.user import User

router = APIRouter()

def classify_protocol(protocol: str) -> dict:
    protocols = {
        "WS" : {"layer": 7, "name": "WebSocket"},
        "TCP": {"layer": 4, "name": "TCP"},
        "UDP": {"layer": 4, "name": "UDP"},
        "HTTP": {"layer": 7, "name": "HTTP"},
    }
    return protocols.get(protocol.upper(), {"layer": 7, "name": "application"})

async def log_network_event(
    db: AsyncSession,
    src_ip: str,
    src_port: int,
    start_time: float,
    protocol: str,
    dst_port: int = 0
):
    osi = classify_protocol(protocol)
    latency_ms = (time.time() - start_time) * 1000

    log = NetworkLog(
        timestamp=datetime.utcnow(),
        protocol=protocol,
        src_ip=src_ip,
        src_port=src_port,
        dst_port=dst_port,
        latency_ms=latency_ms,
        osi_layer=osi["layer"],
        osi_name=osi["name"]
    )
    db.add(log)
    await db.commit()

@router.get("/network-logs")
async def get_network_logs(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admins only")
    
    result = await db.execute(
        select(NetworkLog).order_by(NetworkLog.timestamp.desc()).limit(100)
    )
    logs = result.scalars().all()
    return [
        {
            "id": log.id,
            "timestamp": log.timestamp,
            "protocol": log.protocol,
            "src_ip": log.src_ip,
            "src_port": log.src_port,
            "dst_port": log.dst_port,
            "latency_ms": log.latency_ms,
            "osi_layer": log.osi_layer,
            "osi_name": log.osi_name,
        }
        for log in logs
    ]