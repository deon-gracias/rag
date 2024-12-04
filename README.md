# RAG Langchain Website

## Setup instructions

### Backend

```python
cd ./backend
conda create -n rag python=3.12
conda activate rag
pip install -r requirements.txt
fastapi dev main.py
```

### Frontend

```python
cd ./frontend
npm install
npm run dev
```
