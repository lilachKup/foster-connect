from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import models  # noqa: F401  (registers models on Base.metadata)
from .config import settings
from .database import Base, engine
from .routers import admin, auth, fosters, organizations


@asynccontextmanager
async def lifespan(app: FastAPI):
    # For local development we auto-create tables. Disable via AUTO_CREATE_TABLES=false
    # and manage the schema with Alembic instead.
    if settings.auto_create_tables:
        Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title="FosterConnect API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(fosters.router)
app.include_router(organizations.router)
app.include_router(admin.router)


@app.get("/", tags=["health"])
def root():
    return {"status": "ok", "service": "FosterConnect API"}
