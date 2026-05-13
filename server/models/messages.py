from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime
from sqlalchemy import String, ForeignKey

from .base import Base

class Message(Base):
    __tablename__ = "messages"

    id:                 Mapped[int] = mapped_column(primary_key=True, autoincrement=True, index=True)
    conversation_id:    Mapped[int] = mapped_column(ForeignKey("conversations.id"), index=True)
    sender_id:          Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    content:            Mapped[str] = mapped_column(String(2000))
    timestamp:          Mapped[datetime] = mapped_column(default=datetime.utcnow)
    is_read:            Mapped[bool] = mapped_column(default=False)