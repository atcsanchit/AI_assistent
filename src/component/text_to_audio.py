from transformers import SpeechT5Processor, SpeechT5ForTextToSpeech, SpeechT5HifiGan
from datasets import load_dataset
import torch
import soundfile as sf
from dataclasses import dataclass
from src.logger import logging
from src.exception import CustomException
import sys
import os
import base64

@dataclass

class TextToAudioConfig:
    device = "cuda" if torch.cuda.is_available() else "cpu"
    processor = SpeechT5Processor.from_pretrained("microsoft/speecht5_tts")
    model = SpeechT5ForTextToSpeech.from_pretrained("microsoft/speecht5_tts").to(device)
    vocoder = SpeechT5HifiGan.from_pretrained("microsoft/speecht5_hifigan").to(device)
    embeddings_dataset = load_dataset("Matthijs/cmu-arctic-xvectors", split="validation")
    speakers = {
        'awb': 0,     # Scottish male
        'bdl': 1138,  # US male
        'clb': 2271,  # US female
        'jmk': 3403,  # Canadian male
        'ksp': 4535,  # Indian male
        'rms': 5667,  # US male
        'slt': 6799   # US female
    }

class TextToAudio:
    def __init__(self):
        self.t2a_config_obj = TextToAudioConfig()
    
    def text_to_speech(self, text, speaker_id=None):
        try:
            inputs = self.t2a_config_obj.processor(text=text, return_tensors="pt").to(self.t2a_config_obj.device)
            if speaker_id is not None:
                speaker_embeddings = torch.tensor(self.t2a_config_obj.embeddings_dataset[speaker_id]["xvector"]).unsqueeze(0).to(self.t2a_config_obj.device)
            else:
                speaker_embeddings = torch.randn((1, 512)).to(self.t2a_config_obj.device)
            speech = self.t2a_config_obj.model.generate_speech(inputs["input_ids"], speaker_embeddings, vocoder=self.t2a_config_obj.vocoder)
            output_file = f"output_{speaker_id}.wav" if speaker_id else "output_random.wav"
            sf.write(output_file, speech.cpu().numpy(), samplerate=16000)
            print(f"Audio saved as {output_file}")
        except Exception as e:
            logging.info(f"Error in text_to_speech -- {e}")
            raise CustomException(e,sys)
        

    def audio_to_base64(self, audio_file_path):
        """
        Convert an audio file to a base64-encoded string.
        
        :param audio_file_path: Path to the audio file (e.g., .wav, .mp3).
        :return: Base64-encoded string of the audio file.
        """
        try:
            with open(audio_file_path, "rb") as audio_file:
                encoded_audio = base64.b64encode(audio_file.read()).decode("utf-8")
            return encoded_audio
        except Exception as e:
            print(f"Error: {e}")
            return None
# if __name__ == "__main__":
#     main_obj = TextToAudio()
#     text = "Oh, for crying out loud, I'm Kartik Momlover. What do you want? Spit it out, I haven't got all day to be sitting around chatting with the likes of you."
#     main_obj.text_to_speech(text, speaker_id=6799)
#     print("*************************************************")
#     print(main_obj.audio_to_base64(audio_file_path="output_6799.wav"))