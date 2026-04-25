from fastapi import FastAPI

from services import devices

app = FastAPI()

# Include the devices service
app.include_router(
    devices.router,
    prefix="/devices",
    tags=["devices"]
)


@app.get("/")
def home():

    return "Hello from BrainFlow!"


@app.get("/connect")
def connect():

    return "Connecting..."