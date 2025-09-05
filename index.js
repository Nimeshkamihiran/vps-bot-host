const express = require('express');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const simpleGit = require('simple-git');

const app = express();
const PORT = 3000;
const BASE_DIR = path.join(__dirname, 'repos');
const REPO_NAME = 'neno-xmd-bot'; // fixed repo name
const REPO_URL_BASE = 'https://github.com/'; // username will vary

if (!fs.existsSync(BASE_DIR)) fs.mkdirSync(BASE_DIR);

app.use(express.urlencoded({ extended: true }));

// Serve HTML + CSS + JS
app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
    <meta charset="UTF-8">
    <title>Neno XMD Repo Host</title>
    <style>
    body {
        background: #0d0d0d;
        font-family: 'Arial', sans-serif;
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
        flex-direction: column;
    }
    .container { text-align: center; width: 80%; }
    .neon-text {
        font-size: 60px;
        color: #00f0ff;
        text-shadow: 0 0 5px #00f0ff, 0 0 10px #00f0ff, 0 0 20px #00f0ff, 0 0 40px #00f0ff;
    }
    button {
        padding: 15px 30px;
        border-radius: 8px;
        border: none;
        background: #00f0ff;
        color: #0d0d0d;
        font-weight: bold;
        font-size: 16px;
        cursor: pointer;
        margin: 15px 0;
    }
    button:hover { background: #00c4d1; }
    .console {
        background: #1a1a1a;
        color: #0ff;
        padding: 15px;
        border-radius: 8px;
        width: 100%;
        max-height: 300px;
        overflow-y: auto;
        font-family: monospace;
        text-align: left;
    }
    input {
        padding: 10px;
        border-radius: 6px;
        border: 2px solid #00f0ff;
        margin-right: 10px;
        background: #1a1a1a;
        color: #fff;
        outline: none;
    }
    input::placeholder { color: #aaa; }
    </style>
    <script src="/socket.io/socket.io.js"></script>
    <script>
    document.addEventListener('DOMContentLoaded', () => {
        const socket = io();
        const consoleOutput = document.getElementById('consoleOutput');
        const runForm = document.getElementById('runForm');

        socket.on('log', data => {
            const line = document.createElement('div');
            line.textContent = data;
            consoleOutput.appendChild(line);
            consoleOutput.scrollTop = consoleOutput.scrollHeight;
        });

        runForm.addEventListener('submit', e => {
            e.preventDefault();
            const formData = new FormData(runForm);
            fetch('/run', { method: 'POST', body: new URLSearchParams(formData) })
                .then(res => res.text())
                .then(msg => console.log(msg));
        });
    });
    </script>
    </head>
    <body>
    <div class="container">
        <h1 class="neon-text">NENO XMD</h1>
        <p>Repo: <strong>neno-xmd-bot</strong></p>
        <form id="runForm">
            <input type="text" name="username" placeholder="GitHub Username (default: Nimeshkamihiran)">
            <button type="submit">Run Repo</button>
        </form>
        <div id="consoleOutput" class="console"></div>
    </div>
    </body>
    </html>
    `);
});

// Run repo
app.post('/run', async (req, res) => {
    const username = req.body.username || 'Nimeshkamihiran';
    const repoUrl = `${REPO_URL_BASE}${username}/${REPO_NAME}.git`;
    const folderName = `${REPO_NAME}-${username}-${Date.now()}`;
    const repoPath = path.join(BASE_DIR, folderName);

    const io = req.app.get('io');
    function sendLog(msg) { io.emit('log', msg); }

    try {
        sendLog(`Cloning ${repoUrl} into ${folderName} ...`);
        const git = simpleGit();
        await git.clone(repoUrl, repoPath);
        sendLog('✅ Repo cloned!');

        if (fs.existsSync(path.join(repoPath, 'package.json'))) {
            sendLog('Installing dependencies...');
            const install = exec(`cd ${repoPath} && npm install`);
            install.stdout.on('data', data => sendLog(data));
            install.stderr.on('data', data => sendLog(data));

            install.on('close', () => {
                sendLog('Starting bot...');
                const startBot = exec(`cd ${repoPath} && npm start`);
                startBot.stdout.on('data', data => sendLog(data));
                startBot.stderr.on('data', data => sendLog(data));
            });
        }
        res.send('✅ Process started! Check console below.');
    } catch (err) {
        console.error(err);
        sendLog('❌ Error during clone/install/run.');
        res.send('❌ Error starting process.');
    }
});

// Setup server + socket.io
const server = require('http').createServer(app);
const io = require('socket.io')(server);
app.set('io', io);

server.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
