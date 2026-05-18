import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.routers import auth, array, linkedlist, ai_tutor, compiler, practice, performance, report
from backend.routers import bst, graph, sorting, avl

app = FastAPI(
    title="AlgoVision API",
    version="1.0.0",
    description="AI-Powered Data Structures Learning & Analysis System",
)

# Build CORS origins: always include localhost + any CORS_ORIGINS env var entries
_default_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://algo-vision-ai-powered-data-structures-learning-and-p3pkh69kc.vercel.app",
]
_extra = os.environ.get("CORS_ORIGINS", "")
_origins = _default_origins + [o.strip() for o in _extra.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(array.router, prefix="/array", tags=["Array"])
app.include_router(linkedlist.router, prefix="/linkedlist", tags=["LinkedList"])
app.include_router(ai_tutor.router, prefix="/ai", tags=["AI Tutor"])
app.include_router(compiler.router, tags=["Compiler"])
app.include_router(practice.router, prefix="/practice", tags=["Practice"])
app.include_router(performance.router, prefix="/performance", tags=["Performance"])
app.include_router(report.router, prefix="/report", tags=["Report"])

# ── V2: Trees & Graphs ──────────────────────────────────────────────────────
app.include_router(bst.router, prefix="/bst", tags=["BST"])
app.include_router(avl.router, prefix="/avl", tags=["AVL"])
app.include_router(graph.router, prefix="/graph", tags=["Graph"])

# ── V3: Sorting & Searching ─────────────────────────────────────────────────
app.include_router(sorting.router, prefix="/sorting", tags=["Sorting"])


@app.get("/")
def root():
    return {"status": "AlgoVision API running", "version": "1.0.0"}


@app.get("/health")
def health():
    return {"status": "ok"}
