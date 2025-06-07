import os
import sys
from langchain_mistralai import ChatMistralAI
from langchain_core.messages import AIMessage
from dotenv import load_dotenv
from dataclasses import dataclass

from src.logger import logging
from src.exception import CustomException

@dataclass
class ConversationConfig:
    model="mistral-large-latest"
    # vector_db_path = os.path.join("artifacts","prepare_vector_db")
    temprature = 0.2
    # embedding_model_name = "BAAI/bge-base-en"
    model_kwargs = {"device": "cpu"}
    encode_kwargs = {"normalize_embeddings": True}

class Conversation:
    def __init__(self):
        self.prediction_config = ConversationConfig()

    def load_model(self):
        try:
            load_dotenv()
            api_key = os.getenv("MISTRAL_API_KEY")
            os.environ["MISTRAL_API_KEY"] = api_key
            self.llm = ChatMistralAI(model=self.prediction_config.model,
                                     temprature = self.prediction_config.temprature,
                                     max_retries = 2)
            print("*"*100)
            print("model load successfully")
        except Exception as e:
            logging.info(f"Error in load_model -- {e}")
            raise CustomException(e,sys)
    
    def predict_score(self, command):
        try:
            messages = [
        (
            "system",
            "You are a helpful assistant that will be responding to human queries and talk to them in a very human way possible. Your name is 'B twenty eight' and the queries will be related to general conversations. Keep your answers short.",
        ),
        ("human", f"{command}")]   
            ai_msg = self.llm.invoke(messages)
            # ai_message = AIMessage(ai_msg)
            print(ai_msg.content)
            return ai_msg.content
        
        except Exception as e:
            logging.info(f"Error in predict_score -- {e}")
            raise CustomException(e,sys)
        

