import os
import sys
from dataclasses import dataclass
from src.component.prediction_mistral import PredictionMistral
from src.logger import logging
from src.exception import CustomException

@dataclass
class CommandPipeline:
    def __init__(self):
        pass

    def initiate_pipeline(self, command):
        try:
            mistral_obj = PredictionMistral()
            mistral_obj.load_model()
            mistral_obj.predict_score(command=command)

        except Exception as e:
            logging.info(f"Error in command pipeline ---- {e}")
            raise CustomException(e,sys)


# if __name__ == "__main__":
#     pipeline = CommandPipeline()
#     pipeline.initiate_pipeline(command="xyz")