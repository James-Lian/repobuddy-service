// Step 1: Check if repo is public
// Step 2: Check for owner + repository name
// Step 3: Retrieve filepaths (all)
// Step 4: User action: retrieve file contents

import { Octokit } from "@octokit/rest";

const octokit = new Octokit({ auth: process.env.GITHUB_KEY})

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method == "OPTIONS") {
        res.status(200).end();
        return;
    }

    const content = req.body;

    if (content.requestType == "repo-paths") {
        let branch;
        if (!content.branch) {
            const { data: repoData } = await octokit.repos.get({ owner, repo });
            branch = repoData.default_branch;
        }

        const { data: treeData } = await octokit.git.getTree({
            owner: content.owner,
            repo: content.repo,
            tree_sha: branch,
            recursive: "1"
        })

        const files = treeData.tree
            .filter(item => item.type === "blob")
            .map(item => item.path)
        
        res.status(200).json({ content: files });
    }
}