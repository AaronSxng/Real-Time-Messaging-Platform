from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime
from sqlalchemy import ForeignKey

from .base import Base

class ConversationMember(Base):
    __tablename__ = "conversation_members"

    user_id:         Mapped[int] = mapped_column(ForeignKey("users.id"), primary_key=True)
    conversation_id: Mapped[int] = mapped_column(ForeignKey("conversations.id"), primary_key=True)
    joined_at:       Mapped[datetime] = mapped_column(default=datetime.utcnow)

