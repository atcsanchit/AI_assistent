import dotenv from 'dotenv';
import { WebSocketServer } from 'ws';
import app from './app.js';
import TranscriptionService from './transcriptionService.js';

dotenv.config();

const wss = new WebSocketServer({ noServer: true });

const transcriptionService = new TranscriptionService(process.env.DEEPGRAM_API_KEY);
transcriptionService.startConnection();

wss.on('connection', (ws) => {
  console.log("New WebSocket connection established");

  ws.on('message', (message) => {
    console.log(message)
    transcriptionService.sendAudio(message);
  });

  transcriptionService.on('transcription', (finalText) => {
    console.log("Server response: ", finalText)
    ws.send(JSON.stringify({ type: 'final', text: finalText }));
  });

  transcriptionService.on('interim', (interimText) => {
    ws.send(JSON.stringify({ type: 'interim', text: interimText }));
  });

  ws.on('close', () => {
    console.log("WebSocket connection closed");
  });
});

const server = app.listen(process.env.PORT || 3000, () => {
  console.log(`Express server is running on port ${process.env.PORT || 3000}`);
});

server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});
