from fastapi import FastAPI
from contextlib import asynccontextmanager

from services import devices
from services import eeg

from utils.muse.ConnectionManager import get_connection_manager

@asynccontextmanager
async def lifespan(_: FastAPI):
    # Startup code - nothing for now
    yield

    # Shutdown
    print("Shutting down: disconnecting Muse...")
    manager = get_connection_manager()
    await manager.stop_streaming()
    await manager.disconnect()

app = FastAPI(lifespan=lifespan)

# Include the devices service
app.include_router(
    devices.router,
    prefix="/devices",
    tags=["devices"]
)

# Include the EEG streaming service
app.include_router(
    eeg.router,
    prefix="/eeg",
    tags=["eeg"]
)


@app.get("/")
def home():
    return "Hello from BrainFlow!"
