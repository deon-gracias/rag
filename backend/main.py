from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.routes import chat_session
from backend import db

import os

data_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
docs_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data/documents/")
sessions_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data/sessions/")
dirs = [data_dir, docs_dir, sessions_dir]

for dir in dirs:
    if not os.path.exists(dir): os.makedirs(dir)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    db.create_db_and_tables()

@app.get("/check_health")
def test():
    return {"response": "System is up!"}

app.include_router(chat_session.chat_sessions_router, prefix="/session")
