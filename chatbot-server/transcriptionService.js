import { createClient, LiveTranscriptionEvents } from '@deepgram/sdk';
import { Buffer } from 'node:buffer';
import EventEmitter from 'events';
import dotenv from 'dotenv';
import fs from 'fs';


dotenv.config();

class TranscriptionService extends EventEmitter {
  constructor(apiKey) {
    super();
    this.deepgram = createClient(apiKey);
    this.dgConnection = null;
    this.finalResult = '';
    this.speechFinal = false;
    this.receivedData = [];
  }

  startConnection() {
    this.dgConnection = this.deepgram.listen.live({
      encoding: process.env.ENCODING || 'mulaw',
      sample_rate: process.env.SAMPLE_RATE || '8000',
      model: process.env.TRANSCRIPTION_MODEL || 'nova-2',
      punctuate: true,
      interim_results: true,
    });

    this.dgConnection.on(LiveTranscriptionEvents.Open, () => {
      console.log('Deepgram connection opened');

      this.dgConnection.on(LiveTranscriptionEvents.Transcript, (transcriptionEvent) => {
        console.log("Transcript event channel: ", transcriptionEvent.channel);
        const alternatives = transcriptionEvent.channel?.alternatives;
        let text = '';
        if (alternatives) {
          text = alternatives[0]?.transcript;
        }

        if (transcriptionEvent.type === 'UtteranceEnd') {
          if (!this.speechFinal) {
            console.log(`UtteranceEnd received before speechFinal, emit the text collected so far: ${this.finalResult}`);
            this.emit('transcription', this.finalResult);
            return;
          } else {
            console.log('STT -> Speech was already final when UtteranceEnd received');
            return;
          }
        }

        if (transcriptionEvent.is_final && text.trim().length > 0) {
          this.finalResult += ` ${text}`;

          if (transcriptionEvent.speech_final) {
            this.speechFinal = true;
            console.log(this.finalResult)
            this.emit('transcription', this.finalResult);
            this.finalResult = '';
          } else {
            this.speechFinal = false;
          }
        } else {
          this.emit('interim', text);
        }
      });

      this.dgConnection.on(LiveTranscriptionEvents.Error, (error) => {
        console.error('Deepgram error:', error);
      });

      this.dgConnection.on(LiveTranscriptionEvents.Warning, (warning) => {
        console.error('Deepgram warning:', warning);
      });

      this.dgConnection.on(LiveTranscriptionEvents.Metadata, (metadata) => {
        console.log('Deepgram metadata:', metadata);
      });

      this.dgConnection.on(LiveTranscriptionEvents.Close, () => {
        console.log('Deepgram connection closed');
        this.receivedData = [];
        this.speechFinal = false;
        this.finalResult = '';
      });
    });
  }

  sendAudio(payload) {
    if (this.dgConnection && this.dgConnection.getReadyState() === 1) {
      let newBuffer = Buffer.from(payload, 'base64');
      this.receivedData.push(newBuffer);
      this.dgConnection.send(newBuffer)
      this.onMessageReceived(this.receivedData);
    } else {
      this.startConnection();
      setTimeout(() => {
        if (this.dgConnection) {
          let newBuffer = Buffer.from(payload, 'base64');
          this.receivedData.push(newBuffer);
          this.dgConnection.send(newBuffer)
          this.onMessageReceived(this.receivedData);
        }
      }, 1000);
    }
  }

  async transcribeAudioFile(filePath) {
    try {
      const { result, error } = await this.deepgram.listen.prerecorded.transcribeFile(
        fs.readFileSync(filePath),
        {
          model: "nova-3",
          smart_format: true,
        }
      );

      if (error) {
        console.error('Deepgram transcription error:', error);
        return;
      }

      if (result) {
        const transcription = result.results.channels[0].alternatives[0].transcript;
        console.log('Transcription:', transcription);
        this.emit('transcription', transcription);
        this.dgConnection.requestClose();
      }
    } catch (err) {
      console.error('Error transcribing audio file:', err);
    }
  }

  onMessageReceived(buffer) {
    try {
      let text = buffer.toString('utf8');
      try {
        const filePath = process.env.AUDIO_PATH;
        const bufferNew = Buffer.from(text, 'base64');
        fs.writeFile(filePath, bufferNew, (err) => {
          if (err) {
            console.error("Error saving the file:", err);
          } else {
            console.log("Audio file saved successfully!");
            this.transcribeAudioFile(filePath)
          }
        });
      } catch (jsonError) {
        console.error("Failed to parse JSON:", jsonError);
      }
    } catch (error) {
      console.error("Error decoding the buffer:", error);
    }
  }
}

export default TranscriptionService;