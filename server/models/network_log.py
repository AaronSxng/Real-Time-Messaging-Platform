from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime
from sqlalchemy import String, Float, Integer

from .base import Base

class NetworkLog(Base):
    __tablename__ = "network_logs"

    id:         Mapped[int]      = mapped_column(primary_key=True, autoincrement=True)
    timestamp:  Mapped[datetime] = mapped_column(default=datetime.utcnow)
    protocol:   Mapped[str]      = mapped_column(String(10))
    src_ip:     Mapped[str]      = mapped_column(String(50))
    src_port:   Mapped[int]      = mapped_column(Integer)
    dst_port:   Mapped[int]      = mapped_column(Integer)
    latency_ms: Mapped[float]    = mapped_column(Float)
    osi_layer:  Mapped[int]      = mapped_column(Integer)
    osi_name:   Mapped[str]      = mapped_column(String(20))