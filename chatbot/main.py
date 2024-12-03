import bs4
from langchain import hub
from langchain_community.document_loaders import WebBaseLoader
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langgraph.graph import START, StateGraph
from langchain_ollama import OllamaLLM, OllamaEmbeddings
from langchain_chroma import Chroma
from typing_extensions import List, TypedDict

llm = OllamaLLM(model = "llama3.2-vison")
embeddings = OllamaEmbeddings(model="llama3.2-vision")
vector_store = Chroma(
    embedding_function=embeddings,
    persist_directory="./chroma_langchain_db"
)

def load_documents(vector_store):
    # Load and chunk contents of the blog
    print("Loading Documents...")
    loader = WebBaseLoader(
        web_paths=("https://lilianweng.github.io/posts/2023-06-23-agent/",),
        bs_kwargs=dict(
            parse_only=bs4.SoupStrainer(
                class_=("post-content", "post-title", "post-header")
            )
        ),
    )
    docs = loader.load()

    print("Splitting Text...")
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    all_splits = text_splitter.split_documents(docs)

    # Index chunks
    print("Adding Documents to Vector Store...")
    vector_store = Chroma.from_documents(
        all_splits,
        embeddings,
        persist_directory="./chroma_langchain_db"
    )
    

    print(f"Total documents in vector store: {len(vector_store.get())}")

    return vector_store

load_documents()

# Define prompt for question-answering
print("Pulling Prompt...")
prompt = hub.pull("rlm/rag-prompt")

# Define state for application
class State(TypedDict):
    question: str
    context: List[Document]
    answer: str

# Define application steps
def retrieve(state: State):
    print("Retriving...")

    retrieved_docs = vector_store.similarity_search(state["question"])
    return {"context": retrieved_docs}

def generate(state: State):
    print("Generating...")

    docs_content = "\n\n".join(doc.page_content for doc in state["context"])
    messages = prompt.invoke({"question": state["question"], "context": docs_content})
    response = llm.invoke(messages)
    return {"answer": response.content}

# Compile application and test
graph_builder = StateGraph(State).add_sequence([retrieve, generate])
graph_builder.add_edge(START, "retrieve")
graph = graph_builder.compile()
