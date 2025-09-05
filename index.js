const express = require('express');
const bodyParser = require('body-parser');
const simpleGit = require('simple-git');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;
const BASE_DIR = path.join(__dirname, 'repos');

// Create repos folder if not exists
if (!fs.existsSync(BASE_DIR)) fs.mkdirSync(BASE_DIR);

app.use(bodyParser.urlencoded({ extended: true }));

// Serve index.html from same folder
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Handle form submission
app.post('/clone', async (req, res) => {
    const userName = req.body.userName.trim();
    const repoName = req.body.repoName.trim();

    if (repoName !== 'neno-xmd-bot') {
        return res.send("❌ Repo name must be 'neno-xmd-bot' to submit!");
    }

    const repoUrl = `https://github.com/${userName}/${repoName}.git`;
    const folderName = "neno-xmd";
    const repoPath = path.join(BASE_DIR, folderName);
    const git = simpleGit();

    try {
        await git.clone(repoUrl, repoPath);
        console.log(`Cloned ${repoUrl} to ${repoPath}`);

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

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
