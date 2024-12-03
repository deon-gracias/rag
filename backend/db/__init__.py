from functools import partial
from typing import Annotated, Optional, override

from fastapi import Depends
from sqlmodel import Session, SQLModel, create_engine

import os

construct_session_path = lambda file: os.path.join(os.path.dirname(os.path.abspath(__file__)), f"../data/sessions/{file}.db")

sqlite_file_name = os.path.join(os.path.dirname(os.path.abspath(__file__)), "../data/database.db")
sqlite_url = f"sqlite:///{sqlite_file_name}"

connect_args = {"check_same_thread": False}
engine = create_engine(sqlite_url, connect_args=connect_args)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

def get_session(engine):
    with Session(engine) as session:
        yield session

SessionDep = Annotated[Session, Depends(partial(get_session, engine))]
