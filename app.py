from fastapi import FastAPI
from Muse import Muse


app = FastAPI()

@app.get("/")
def home():
    return "hello"



@app.get("/connect")
def connect():

    return "connecting"