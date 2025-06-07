const { app, BrowserWindow, ipcMain, screen } = require("electron");
const { exec } = require("child_process");
const path = require("path");
const os = require("os");
const fs = require("fs");

let mainWindow;

app.disableHardwareAcceleration();

app.whenReady().then(() => {
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize;

    mainWindow = new BrowserWindow({
        width: 350,
        height: 500,
        x: width - 370,
        y: height - 520,
        frame: false,
        alwaysOnTop: true,
        transparent: true,
        resizable: false,
        webPreferences: {
            contextIsolation: true,
            webSecurity: false,
            experimentalFeatures: true,
            nodeIntegration: false,
            enableRemoteModule: true,
            enableWebSpeechAPI: true,
            media: true,
            preload: path.join(__dirname, "preload.js")
        }
    });

    mainWindow.loadFile("index.html");
    app.commandLine.appendSwitch("enable-speech-dispatcher");
});

ipcMain.on("execute-command", (event, command) => {
    console.log("Executing Command:", command);

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Execution Error: ${error.message}`);
            event.reply("command-output", { success: false, message: error.message });
            return;
        }
        if (stderr) {
            console.error(`Execution Stderr: ${stderr}`);
            event.reply("command-output", { success: false, message: stderr });
            return;
        }
        console.log(`Execution Output: ${stdout}`);
        event.reply("command-output", { success: true, message: stdout });
    });
});

ipcMain.handle("get-files", async (event, directoryPath = os.homedir()) => {
    try {
        const files = fs.readdirSync(directoryPath, { withFileTypes: true });

        return files.map(file => ({
            name: file.name,
            isDirectory: file.isDirectory(),
        }));
    } catch (error) {
        console.error("Error reading directory:", error);
        return { error: error.message };
    }
});

ipcMain.on("close-app", () => {
    app.quit();
});

ipcMain.on("minimize-app", () => {
    if (mainWindow) {
        mainWindow.minimize();
    }
});
