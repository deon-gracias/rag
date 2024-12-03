import uuid
from typing import Annotated, List

from sqlmodel import select
from fastapi import Form, HTTPException, APIRouter, UploadFile, File

from pydantic import BaseModel
from sqlmodel import select, col

from backend.services.llm import LLMOrchestrator
from backend.db.models import ChatSession, Chat
from backend.db import SessionDep, construct_session_path
from backend.services.llm import vector_db_path

import os

docs_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "../data/documents/")

chat_sessions_router = APIRouter()

@chat_sessions_router.post("/new")
def create_session(session: SessionDep) -> ChatSession:
    chat_session = ChatSession(updated_at=None)

    session.add(chat_session)
    session.commit()
    session.refresh(chat_session)
    return chat_session


@chat_sessions_router.get("/")
def get_sessions(session: SessionDep, name: uuid.UUID | None = None):
    chat_sessions = session.exec(select(ChatSession)).all()
    return chat_sessions


@chat_sessions_router.get("/{id}")
def get_session(session: SessionDep, id: int | uuid.UUID | None = None):
    if not id:
        raise HTTPException(status_code=405, detail="Requires atleast id or name")

    statement = select(ChatSession).where(
        ChatSession.id == id
            if type(id) is int
            else ChatSession.name == id 
    )

    chat_session = session.exec(statement).first()

    if not chat_session:
        raise HTTPException(status_code=404, detail="Couldn't find chat session")

    return chat_session


@chat_sessions_router.delete("/{id}")
def delete_session(id: int, session: SessionDep):
    chat_session = session.get(ChatSession, id)

    if not chat_session:
        raise HTTPException(status_code=404, detail="Chat Sessoin not found")

    session.delete(chat_session)
    session.commit()

    import glob
    vector_location = os.path.join(vector_db_path, str(chat_session.name))
    if os.path.exists(vector_location):
        for path in glob.glob(os.path.join(vector_location, "*")):
            os.remove(path)
        os.rmdir(vector_location)

    docs_location = os.path.join(docs_dir, str(chat_session.name))
    if os.path.exists(docs_location):
        for path in glob.glob(os.path.join(docs_location, "*")):
            os.remove(path)
        os.rmdir(docs_location)

    sqlite_file_name = construct_session_path(chat_session.name)
    if os.path.exists(sqlite_file_name):
        os.remove(sqlite_file_name)

    return {"ok": True, "data": chat_session}

class Query(BaseModel):
    question: str


@chat_sessions_router.post("/{chat_session_name}/chat")
def session_chat(chat_session_name: uuid.UUID, query: Query, session: SessionDep):
    chat_session = session.exec(select(ChatSession).where(
        ChatSession.name == chat_session_name 
    )).first()

    if (not chat_session) or (chat_session.id is None): 
        raise HTTPException(status_code=404, detail="Chat session not found")

    session.add(Chat(
        updated_at=None,
        type="human",
        content=query.question,
        chat_session_id=chat_session.id
    ))
    session.commit()

    orch = LLMOrchestrator(str(chat_session.name))
   
    response = orch.agent.invoke(
        {"messages": [{"role": "user", "content": query.question}]},
        stream_mode="values",
        config=orch.config,
    )["messages"][-1]

    session.add(Chat(
        updated_at=None,
        type="ai",
        content=response.content,
        chat_session_id=chat_session.id
    ))
    session.commit()

    return response


@chat_sessions_router.get("/{chat_session_name}/chat")
def get_session_chat(chat_session_name: uuid.UUID, session: SessionDep):
    chat_session = session.exec(select(ChatSession).where(
        ChatSession.name == chat_session_name 
    )).first()

    if (not chat_session) or (chat_session.id is None): 
        raise HTTPException(status_code=404, detail="Chat session not found")

    results = session.exec(
        select(Chat)
            .where(Chat.chat_session_id == chat_session.id)
            .order_by(col(Chat.created_at))
    ).all()

    return results


@chat_sessions_router.post("/{chat_session_name}/upload")
def upload_files_to_session(
        chat_session_name: uuid.UUID,
        files: Annotated[List[UploadFile], File(description="Multiple files as UploadFile")],
        session: SessionDep
):
    chat_session = session.exec(select(ChatSession).where(
        ChatSession.name == chat_session_name 
    )).first()

    if (not chat_session) or (chat_session.id is None): 
        raise HTTPException(status_code=404, detail="Chat session not found")

    saved_files_path = []

    for path in files:
        session_docs_dir = os.path.join(docs_dir, str(chat_session.name))
        doc_path = os.path.join(session_docs_dir, str(path.filename))

        if not os.path.exists(session_docs_dir):
            os.makedirs(session_docs_dir) # Make dir for session just in case

        with open(doc_path, "wb") as f: f.write(path.file.read())

        saved_files_path.append(doc_path)

    llm = LLMOrchestrator(str(chat_session.name))
    for path in saved_files_path:
        llm.add_documents(LLMOrchestrator.load_documents(path))

    return {"ok": True}


@chat_sessions_router.post("/create_and_upload")
def create_and_upload_files_to_session(
        session: SessionDep,
        files: Annotated[List[UploadFile], File(description="Multiple files as UploadFile")],
        quality: str = Form(...),
):
    chat_session = ChatSession(updated_at=None)
    print(quality)

    session.add(chat_session)

    llm = LLMOrchestrator(str(chat_session.name))
    docs = []

    for path in files:
        docs_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "../data/documents/")
        session_docs_dir = os.path.join(docs_dir, str(chat_session.name))
        doc_path = os.path.join(session_docs_dir, str(path.filename))

        if not os.path.exists(session_docs_dir):
            os.makedirs(session_docs_dir) # Make dir for session just in case

        with open(doc_path, "wb") as f: f.write(path.file.read())

        docs.extend(LLMOrchestrator.load_documents(
            doc_path,
            fast=(True if quality == "fast" else False)
        ))
    
    import json
    json.dump(str(docs), open("test", "w"))
    llm.add_documents(docs)

    session.commit()
    session.refresh(chat_session)

    return {"ok": True, "data": chat_session}
