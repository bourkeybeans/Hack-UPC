from fastapi import FastAPI


app = FastAPI()

@app.get("/")
def home():
    return "hello"



@app.get("/connect")
def connect():
    return "connecting"