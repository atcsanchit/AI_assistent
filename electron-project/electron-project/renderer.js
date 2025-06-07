document.addEventListener("DOMContentLoaded", () => {

    const closeBtn = document.getElementById("close");
    const minimizeBtn = document.getElementById("minimize");
    const sendBtn = document.getElementById("sendBtn");
    const voiceBtn = document.getElementById("voiceBtn");
    const userInput = document.getElementById("userInput");

    if (closeBtn) {
        closeBtn.addEventListener("click", () => {
            window.electron.ipcRenderer.send("close-app");
        });
    } else {
        console.error("Close button not found!");
    }

    if (minimizeBtn) {
        minimizeBtn.addEventListener("click", () => {
            window.electron.ipcRenderer.send("minimize-app");
        });
    } else {
        console.error("Minimize button not found!");
    }

    if (!sendBtn) {
        console.error("sendBtn not found! Check index.html.");
        return;
    }

    sendBtn.addEventListener("click", sendMessage);

    if (userInput) {
        userInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                sendMessage();
            }
        });
    } else {
        console.error("User input field not found!");
    }

    if (voiceBtn) {
        voiceBtn.addEventListener("click", startVoiceRecognition);
    }
});

let ws;
let mediaRecorder;
let audioChunks = [];

function initWebSocket() {
    ws = new WebSocket("ws://localhost:3000");

    ws.onopen = () => {
        console.log("WebSocket connection established.");
    };

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log("Received WebSocket message:", data);
        if (data.type === "final") {
            document.getElementById("userInput").value = data.text;
            sendMessage();
            sendTextToAPI(data.text);
        } else if (data.type === "interim") {
            document.getElementById("userInput").value = data.text;
        }
    };

    ws.onclose = () => {
        console.log("WebSocket connection closed.");
    };

    ws.onerror = (error) => {
        console.error("WebSocket error:", error);
    };
}

function sendMessage() {
    const input = document.getElementById("userInput");
    const chatBox = document.getElementById("chatBox");

    if (!input || !chatBox) {
        console.error("Missing chat elements.");
        return;
    }

    if (input.value.trim() === "") return;

    const userMessage = document.createElement("p");
    userMessage.classList.add("message", "user");
    userMessage.textContent = input.value;
    chatBox.appendChild(userMessage);

    input.value = "";
}

function processBotResponse(userMessage) {
    const chatBox = document.getElementById("chatBox");

    setTimeout(() => {
        const botMessage = document.createElement("p");
        botMessage.classList.add("message", "bot");
        botMessage.textContent = userMessage;
        chatBox.appendChild(botMessage);

        chatBox.scrollTop = chatBox.scrollHeight;
    }, 1000);
}

function startVoiceRecognition() {
    console.log("startAudioRecording function called");

    audioChunks = [];

    const audioConstraints = {
        audio: {
            sampleRate: 8000,
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true,
        },
    };

    navigator.mediaDevices.getUserMedia(audioConstraints)
        .then(stream => {
            mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'audio/webm; codecs=opus',
                audioBitsPerSecond: 128000,
            });

            mediaRecorder.ondataavailable = (event) => {
                audioChunks.push(event.data);
            };

            mediaRecorder.onstart = () => {
                console.log("Audio recording started...");
            };

            mediaRecorder.onstop = () => {
                console.log("Audio recording stopped.");
                const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                
                const reader = new FileReader();
                reader.onload = () => {
                    const base64AudioNew = reader.result.split(',')[1];
                    console.log("base64AudioNew: ", base64AudioNew)
                    sendAudioToServer(base64AudioNew);
                };
                reader.readAsDataURL(audioBlob);
            };
            mediaRecorder.start(100);

            console.log("Audio recording started...");
            setTimeout(() => {
                if (mediaRecorder.state === "recording") {
                    mediaRecorder.stop();
                }
            }, 10000);
        })
        .catch(error => {
            console.error("Error accessing microphone:", error);
            alert("Error accessing microphone.");
        });
}

function sendAudioToServer(base64Audio) {
    if (ws && ws.readyState === WebSocket.OPEN) {
        console.log("Sending audio chunk to server...", base64Audio);
        ws.send(base64Audio);
    } else {
        console.error("WebSocket is not open.");
        initWebSocket();
        setTimeout(() => {
            if (!ws && !(ws.readyState === WebSocket.OPEN)) {
                initWebSocket();
            }
        }, 100);
        setTimeout(() => {
            ws.send(base64Audio);
        }, 100);
    }
}

function sendTextToAPI(text) {
    console.log("FUNCTION CALLED")
    let osType = "Unknown OS";
    if (navigator.userAgent.indexOf("Win") !== -1) {
        osType = "Windows";
    } else if (navigator.userAgent.indexOf("Mac") !== -1) {
        osType = "macOS";
    } else if (navigator.userAgent.indexOf("Linux") !== -1) {
        osType = "Linux";
    }
    console.log(osType)
    ////////////////////////////////////////////////////////////////////////////////////////////
    fetch("http://192.168.93.244:8000/submit", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            command: text,
            os: osType
        })
    })
        .then(response => response.json())
        .then(data => {
            console.log("API Response:", data);
            if (data.response) {
                console.log("Sending command to main process:", data.response);
                if (data.class === "conversation" && data.response) {
                    console.log("Yaha jaa rha h..............................................")
                    processBotResponse(data.response);
                    playBase64Audio(data.payload)
                } else {
                    // console.log("Unhandled API response:", data);
                    window.Electron.ipcRenderer.send("execute-command", data.response);
                }
                // window.Electron.ipcRenderer.send("execute-command", data.response);
            }
        })
        .catch(error => {
            console.error("Error sending text to API:", error);
            processBotResponse("I am still learning")
        });
}

function playBase64Audio(base64String) {
    const base64WithoutPrefix = base64String.split(",")[1] || base64String;
    console.log(base64String);
    base64ToBlob(base64WithoutPrefix, "audio/mp3")
        .then(audioBlob => {
            const audioUrl = URL.createObjectURL(audioBlob);
            console.log("Generated Audio URL:", audioUrl);
            
            const audio = new Audio(audioUrl);
            audio.play().catch(error => console.error("Audio playback failed:", error));
        })
        .catch(error => console.error("Blob creation failed:", error));
}

function base64ToBlob(base64, mimeType) {
    return fetch(`data:${mimeType};base64,${base64}`)
        .then(res => res.blob());
}

async function getFiles(directoryPath = "") {
    try {
        const files = await window.electron.ipcRenderer.invoke("get-files");
        console.log("Files and Folders:", files);
    } catch (error) {
        console.error("Error fetching files:", error);
    }
}

getFiles();

initWebSocket();
