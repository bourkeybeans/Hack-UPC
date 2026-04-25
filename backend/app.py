from fastapi import FastAPI
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

# Include the devices service
app.include_router(
    devices.router,
    prefix="/devices",
    tags=["devices"]
)


@app.get("/")
def home():
    return "Hello from BrainFlow!"
