from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
# import python-multipart
import os
from pathlib import Path
from src.component.prediction_mistral import PredictionMistral
from src.component.class_claasification import ClassClassification
from src.component.text_to_audio import TextToAudio
from src.component.conversation import Conversation
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
    print(command)
    class_classification_obj = ClassClassification()
    class_classification_obj.load_model()
    classify = class_classification_obj.predict_score(command=command)
    base64_encoding = None
    if "action" in classify:
        predict_mistral_obj = PredictionMistral()
        predict_mistral_obj.load_model()
        result = predict_mistral_obj.predict_score(command=command)
    
    else:
        predict_mistral_obj = Conversation()
        predict_mistral_obj.load_model()
        result = predict_mistral_obj.predict_score(command=command)
        main_obj = TextToAudio()
        main_obj.text_to_speech(text = result, speaker_id=6799)
        base64_encoding = main_obj.audio_to_base64(audio_file_path="output_6799.wav")
    
    
    return {"class": classify,
        "response": result,
        "payload": base64_encoding}

@app.get("/test")
async def random(name:str):
    return {"this is cool ":f"{name}"}