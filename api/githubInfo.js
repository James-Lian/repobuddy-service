// Step 1: Check if repo is public
// Step 2: Check for owner + repository name
// Step 3: Retrieve filepaths (all)
// Step 4: User action: retrieve file contents

import { Octokit } from "@octokit/rest";

const octokit = new Octokit({ auth: process.env.GITHUB_KEY})

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', "https://github.com");
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method == "OPTIONS") {
        res.status(200).end();
        return;
    }

    const content = req.body;

    if (content.requestType === "repo-paths") {
        let branch;
        if (!content.branch) {
            const { data: repoData } = await octokit.repos.get({ owner: content.owner, repo: content.repo });
            branch = repoData.default_branch;
        }

        const { data: treeData } = await octokit.git.getTree({
            owner: content.owner,
            repo: content.repo,
            tree_sha: branch,
            recursive: "1"
        })
        
        const fullFileData = treeData.tree
            .filter(item => item.type === "blob")

        let fileData = {}
        
        for (let item of fullFileData) {
            fileData[item.path] = {"sha": item.sha}
            if (item.size) {
                fileData[item.path]["size"] = item.size;
            }
        }

        const files = treeData.tree
            .filter(item => item.type === "blob")
            .map(item => item.path)

        res.status(200).json({ filepaths: files, additionalData: fileData });
    } else if (content.requestType === "file-contents") {
        const contents = []
        for (let path of content.files) {

            const { data: contentsData } = await octokit.repos.getContent({
                owner: content.owner,
                repo: content.repo,
                path: path
            });

            // Buffer is for Node.js and is preferred way for base64 to utf-8, atob/btoa may mishandle utf-8 and is typically for browser-only applications
            const fileContentsString = Buffer.from(contentsData.content, "base64").toString();
            contents.push({ "path": path, "content": fileContentsString });
        }

        res.status(200).json({"content": contents});
    } else if (content.requestType === "readme") {
        try {
            const { data: readmeData } = await octokit.repos.getReadme({
                owner: content.owner,
                repo: content.repo
            });
    
            const readmeContent = Buffer.from(readmeData, 'base64').toString('utf-8');
    
            res.status(200).json({ "readme": readmeContent });
        } catch (e) {
            if (e.status === 404) {
                res.status(404).json({ "error": `Resource not found: The GitHub repository ${content.owner}/${content.repo} doesn't have a README.` });
            }
            else {
                res.status(500).json({"error": e.message});
            }
        }
    }
}