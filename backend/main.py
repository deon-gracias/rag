from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.routes import chat_session
from backend import db

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
