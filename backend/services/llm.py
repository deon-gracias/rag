import os
import sqlite3
from typing import Optional
import uuid
from langchain_community.vectorstores.utils import filter_complex_metadata
from langchain_community.vectorstores import FAISS

from langchain_core.runnables import RunnableConfig

from langchain_unstructured import UnstructuredLoader
from unstructured.cleaners.core import clean_extra_whitespace

from langchain_ollama import ChatOllama, OllamaEmbeddings

from langchain_core.documents import Document
from langchain_core.messages import SystemMessage
from langchain_core.tools import tool

from langgraph.graph import StateGraph, MessagesState, END
from langgraph.prebuilt import ToolNode, create_react_agent, tools_condition
from langgraph.checkpoint.sqlite import SqliteSaver

from typing_extensions import List

from backend.db import construct_session_path

vector_db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "../data/vector_db")

class LLMOrchestrator:
    def __init__(self, session_id: str):
        self.llm = ChatOllama(model="llama3.2", temperature=0)
        self.embeddings = OllamaEmbeddings(model="mxbai-embed-large")
        
        session_vector_db_path = os.path.join(vector_db_path, session_id)
        os.makedirs(session_vector_db_path, exist_ok=True)
        
        self.vector_store: Optional[FAISS] = None
        self.session_id = session_id
        
        self.load_or_create_vector_store()

        self.config: RunnableConfig = {"configurable": {"thread_id": session_id}}

        sqlite_file_name = construct_session_path(session_id)
        conn = sqlite3.connect(
            sqlite_file_name, check_same_thread=False)
        self.memory = SqliteSaver(conn)

        print("Loaded vector store with {} documents".format(
            len(self.vector_store.index_to_docstore_id) if self.vector_store else 0
        ))

        self.setup_tools()
        self.agent = create_react_agent(
            self.llm,
            [self.retrieve_docs],
            checkpointer=self.memory
        )
        self.construct_state_graph()
        # self.agent = self.graph


    def load_or_create_vector_store(self):
        session_vector_db_path = os.path.join(vector_db_path, self.session_id)
        
        try:
            self.vector_store = FAISS.load_local(
                session_vector_db_path, 
                self.embeddings, 
                allow_dangerous_deserialization=True
            )
        except Exception:
            self.vector_store = None
    

    def setup_tools(self):
        @tool(response_format="content_and_artifact")
        def retrieve_docs(query: str):
            """Retrieve information related a query"""
            if not self.vector_store:
                return "No documents in vector store", []

            retrieved_docs = self.vector_store.similarity_search(query, k=2)
            serialized = "\n\n".join(
                (f"Source: {doc.metadata}\n" f"Content: {doc.page_content}")
                for doc in retrieved_docs
            )

            return serialized, retrieved_docs
        
        self.retrieve_docs = retrieve_docs


    @staticmethod
    def load_documents(path: str, fast: bool = False) -> List[Document]:
        loader = UnstructuredLoader(
            file_path=path,
            strategy="fast" if fast else "hi_res",
            post_processors=[clean_extra_whitespace],
            # chunking_strategy="by_title",
            include_orig_elements=False,
        )

        docs = loader.load()

        print(f"Documents loaded {len(docs)}")

        return docs


    def add_documents(self, docs: List[Document]):
        if not self.vector_store:
            if not docs:
                return
            self.vector_store = FAISS.from_documents(
                documents=filter_complex_metadata(docs), 
                embedding=self.embeddings
            )
        else:
            self.vector_store.add_documents(
                documents=filter_complex_metadata(docs)
            )
        
        session_vector_db_path = os.path.join(vector_db_path, self.session_id)
        self.vector_store.save_local(session_vector_db_path)
        
        print(f"Added {len(docs)} to store")


    # Using agents instead right now but its for learning purposes
    def construct_state_graph(self):
        def query_or_respond(state: MessagesState):
            """Generate tool call for retrieval or respond"""
            llm_with_tools = self.llm.bind(functions=[self.retrieve_docs])
            response = llm_with_tools.invoke(state["messages"])

            return {"messages": [response]}

        @tool(response_format="content_and_artifact")
        def retrieve_docs(query: str):
            """Retrieve information related a query"""
            if not self.vector_store:
                return "No documents in vector store", []

            retrieved_docs = self.vector_store.similarity_search(query, k=2)
            serialized = "\n\n".join(
                (f"Source: {doc.metadata}\n" f"Content: {doc.page_content}")
                for doc in retrieved_docs
            )

            return serialized, retrieved_docs
        
        self.graph_builder = StateGraph(MessagesState)
        self.graph_builder.add_node(query_or_respond)
        self.graph_builder.add_node(ToolNode([retrieve_docs]))
        self.graph_builder.add_node(self.generate)

        self.graph_builder.set_entry_point("query_or_respond")
        self.graph_builder.add_conditional_edges(
            "query_or_respond",
            tools_condition,
            {END: END, "tools": "tools"},
        )
        self.graph_builder.add_edge("tools", "generate")
        self.graph_builder.add_edge("generate", END)

        self.graph = self.graph_builder.compile(checkpointer=self.memory)


    def generate(self, state: MessagesState):
        recent_tool_messages = []

        for message in reversed(state["messages"]):
            if message.type == "tool": recent_tool_messages.append(message)
            else: break

        tool_messages = recent_tool_messages[::-1]

        docs_content = "\n\n".join(doc.content for doc in tool_messages)
        system_message_content = (
            "You are an assistant for question-answering tasks. "
            "Use the following pieces of retrieved context to answer "
            "the question. If you don't know the answer, say that you "
            "don't know. Use three sentences maximum and keep the "
            "answer concise."
            "\n\n"
            f"{docs_content}"
        )

        conversation_messages = [
            message
            for message in state["messages"]
            if message.type in ("human", "system")
            or (message.type == "ai" and not message.tool_calls)
        ]

        prompt = [SystemMessage(system_message_content)] + conversation_messages

        response = self.llm.invoke(prompt)

        return {"messages": [response]}


if __name__ == "__main__":
    llm = LLMOrchestrator("test")
    docs = llm.load_documents("../data/documents/2afcfb9d-7b6f-4bea-8592-89a8601427a2/Degree Transcript.pdf")
    llm.add_documents(docs)
