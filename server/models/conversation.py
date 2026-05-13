from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime
from sqlalchemy import String, ForeignKey

from .base import Base

class Conversation(Base):
    __tablename__ = "conversations"

    id:             Mapped[int] = mapped_column(primary_key=True, autoincrement=True, index=True)
    name:           Mapped[str | None] = mapped_column(String(100))
    created_at:     Mapped[datetime] = mapped_column(default=datetime.utcnow)
    created_by:     Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    last_updated:   Mapped[datetime] = mapped_column(default=datetime.utcnow, onupdate=datetime.utcnow)
    is_group:       Mapped[bool] = mapped_column(default=False)

