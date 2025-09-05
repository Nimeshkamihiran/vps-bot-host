const express = require('express');
const bodyParser = require('body-parser');
const simpleGit = require('simple-git');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const BASE_DIR = path.join(__dirname, 'repos');
if (!fs.existsSync(BASE_DIR)) fs.mkdirSync(BASE_DIR);

// Serve HTML page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Handle form submission
app.post('/clone', async (req, res) => {
    const userName = req.body.userName.trim();
    const repoName = req.body.repoName.trim();

    // Repo name must be exactly 'neno-xmd-bot'
    if (repoName !== 'neno-xmd-bot') {
        return res.send("❌ Repo name must be 'neno-xmd-bot' to submit!");
    }

    const repoUrl = `https://github.com/${userName}/${repoName}.git`;
    const folderName = "neno-xmd";
    const repoPath = path.join(BASE_DIR, folderName);

    const git = simpleGit();

    try {
        // Clone repo
        await git.clone(repoUrl, repoPath);
        console.log(`Cloned ${repoUrl} to ${repoPath}`);

        // Install dependencies and start project
        if (fs.existsSync(path.join(repoPath, 'package.json'))) {
            exec(`cd ${repoPath} && npm install && npm start`, (err, stdout, stderr) => {
                if (err) console.error(err);
                console.log(stdout);
                console.error(stderr);
            });
        }

        res.send("✅ Repo cloned and running successfully!");
    } catch (err) {
        console.error(err);
        res.send("❌ Error cloning repo.");
    }
});

app.listen(port, () => console.log(`Server running at http://localhost:${port}`));