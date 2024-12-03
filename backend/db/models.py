import datetime
import uuid 

from sqlmodel import Field, Relationship, SQLModel
from typing import  Optional

class Docs(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    public_id: uuid.UUID = Field(default_factory=uuid.uuid4, index = True)
    name: str
    path: str

class TimestampModel(SQLModel):
    created_at: datetime.datetime = Field(default_factory=datetime.datetime.now)
    updated_at: Optional[datetime.datetime]

class ChatSession(TimestampModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    name: uuid.UUID = Field(default_factory=uuid.uuid4, index=True)

    chats: list["Chat"] = Relationship(back_populates="chat_session", cascade_delete=True)

class Chat(TimestampModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    
    type: str
    content: str 

    chat_session_id: int = Field(default=None, foreign_key="chatsession.id", ondelete="CASCADE")
    chat_session: ChatSession | None = Relationship(back_populates="chats")
