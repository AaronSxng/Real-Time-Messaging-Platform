from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime
from sqlalchemy import String

from .base import Base

class User(Base):
    __tablename__ = "users"

    id:         Mapped[int] = mapped_column(primary_key=True, autoincrement=True, index=True)
    username:   Mapped[str] = mapped_column(String(100), unique=True, index=True)
    email:      Mapped[str] = mapped_column(String(100), unique=True, index=True)
    first_name: Mapped[str] = mapped_column(String(100))
    last_name:  Mapped[str] = mapped_column(String(100))
    hashed_password:   Mapped[str] = mapped_column(String(100))
    last_updated: Mapped[datetime] = mapped_column(default=datetime.utcnow, onupdate=datetime.utcnow)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)