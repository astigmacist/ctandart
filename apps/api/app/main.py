from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.config import settings
from app.db.init_db import init_db
from app.db.session import SessionLocal


def create_app() -> FastAPI:
    app = FastAPI(
        title="CtandART ERP API",
        version="0.1.0",
        description="Web ERP backend for CtandART advertising production workflows.",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(api_router, prefix="/api/v1")

    @app.on_event("startup")
    def on_startup() -> None:
        if settings.auto_create_tables:
            db = SessionLocal()
            try:
                init_db(db)
            finally:
                db.close()

    return app


app = create_app()
