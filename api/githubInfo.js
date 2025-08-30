// Step 1: Check if repo is public
// Step 2: Check for owner + repository name
// Step 3: Retrieve filepaths (all)
// Step 4: User action: retrieve file contents

import { Octokit } from "@octokit/rest";

const octokit = new Octokit({ auth: process.env.GITHUB_KEY})

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method == "OPTIONS") {
        res.status(200).end();
        return;
    }

    const content = req.body;

}