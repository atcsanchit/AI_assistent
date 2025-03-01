from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
# import python-multipart
import os
from pathlib import Path
from src.component.prediction_mistral import PredictionMistral
import os
import json
from pydantic import BaseModel

# from main import process_image

app = FastAPI()

class MappingRequest(BaseModel):
    command: str


@app.get("/")
async def xyz():
    return {"hard coding is good":"but not cool!"}

@app.post("/submit")
async def abc(mapping: MappingRequest):
    mapping = mapping.dict()  # Convert Pydantic model to dictionary
    command = mapping["command"]

    predict_mistral_obj = PredictionMistral()
    predict_mistral_obj.load_model()
    result = predict_mistral_obj.predict_score(command=command)
    
    return {"response": result}

@app.get("/test")
async def random(name:str):
    return {"this is cool ":f"{name}"}