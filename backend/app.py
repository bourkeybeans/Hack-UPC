from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from services import devices

from utils.muse.ConnectionManager import get_connection_manager

@asynccontextmanager
async def lifespan(_: FastAPI):
    # Startup code - nothing for now
    yield

    # Shutdown
    print("Shutting down: disconnecting Muse...")
    await get_connection_manager().disconnect()

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    # Allow any Vite local dev origin (localhost/127.0.0.1 on any port)
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the devices service
app.include_router(
    devices.router,
    prefix="/devices",
    tags=["devices"]
)


@app.get("/")
def home():
    return "Hello from BrainFlow!"
