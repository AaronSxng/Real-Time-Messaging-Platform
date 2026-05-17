from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from database import AsyncSessionLocal, get_db
from models.messages import Message
from models.conversation import Conversation
from models.conversationMember import ConversationMember
from routers.auth import get_current_user
from models.user import User
from pydantic import BaseModel

router = APIRouter()

class ConversationRequest(BaseModel):
    name: str | None = None
    is_group: bool = False
    member_ids: list[int]

@router.get("/users")
async def get_users(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(User).where(User.id != current_user.id))
    users = result.scalars().all()
    return [
        {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name
        }
        for user in users
    ]

@router.get("/conversations")
async def get_conversations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(Conversation)
        .join(ConversationMember, ConversationMember.conversation_id == Conversation.id)
        .where(ConversationMember.user_id == current_user.id)
    )
    conversations = result.scalars().all()
    
    enriched = []
    for conv in conversations:
        if not conv.is_group:
            result = await db.execute(
                select(User)
                .join(ConversationMember, ConversationMember.user_id == User.id)
                .where(ConversationMember.conversation_id == conv.id)
                .where(User.id != current_user.id)
            )
            other_user = result.scalar_one_or_none()
            name = f"{other_user.first_name} {other_user.last_name}" if other_user else "Unknown"
        else:
            name = conv.name or "Unnamed Group"
        enriched.append({
            "id": conv.id,
            "name": name,
            "is_group": conv.is_group
        })
    return enriched

@router.post("/conversations")
async def create_conversation(
    body: ConversationRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    conversation = Conversation(
        name=body.name,
        is_group=body.is_group,
        created_by=current_user.id
    )
    db.add(conversation)
    await db.flush()

    members = [current_user.id] + body.member_ids
    for user_id in members:
        member = ConversationMember(
            conversation_id=conversation.id,
            user_id=user_id
        )
        db.add(member)

    await db.commit()
    return {"conversation_id": conversation.id}

@router.get("/conversations/{conversation_id}/messages")
async def get_messages(
    conversation_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(ConversationMember)
        .where(ConversationMember.conversation_id == conversation_id)
        .where(ConversationMember.user_id == current_user.id)
    )

    if not result.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="Not a member of this conversation")
    
    result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.timestamp)
    )

    messages = result.scalars().all()
    return messages