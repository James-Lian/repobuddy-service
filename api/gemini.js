import { GoogleGenAI } from "@google/genai";

const GOOGLE_API_KEY = process.env.GEMINI_KEY;
const AI = new GoogleGenAI({apiKey: GOOGLE_API_KEY});

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', "https://github.com");
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const { type, content } = req.body;

    if (type) {
        if (type == "LLM-msg") {
            try {
                res.setHeader("Content-Type", "text/event-stream");
                res.setHeader("Cache-Control", "no-cache");
                res.setHeader("Connection", "keep-alive");

                const response = await AI.models.generateContentStream({
                    model: "gemini-2.5-flash",
                    content: [
                        ...content.history,
                        {
                            role: "user",
                            parts: [{ text: content.message }]
                        }
                    ],
                    config: {
                        systemInstruction: content.systemInstruction
                    }
                });
                
                for await (const chunk of response) {
                    res.write(chunk.text);
                }
                res.end();
            } catch (e) {
                console.log(e);
                res.status(500).json({ error: "Server error.", content: e.message });
            }
        }
        else if (type == "file-summarization") {
            try {
                let summaries = [];
                
                const chat = AI.chats.create({
                    model: "gemini-2.5-flash",
                    history: [
                        {
                            role: "user",
                            parts: [{ text: "System prompt: You are an AI tool used to summarize Github repositories (documentation, code, etc.) with the insight and depth of a senior software engineer. This is what will happen: you will be repeatedly fed prompts containing the filepath and file content, on separate lines. For example, you might be fed a prompt like: \n'components/header.tsx\nimport { View, Text } from ...'\n ...in a React Native project. For longer files, the file content might be sectioned like \n'components/header.tsx (1)\nimport { View, Text } from ...'\n'components/header.tsx (2)\nexport default function Header()...'\nA key detail is your summaries will be used primarily by another AI LLM, whose job is facilitate and aid in the action of reading code on Github for a developer. Instead of feeding that AI LLM the entire repository, and potentially hitting the content window limit, that AI LLM will instead receive your summaries. Thus, you should aim to keep your summaries as concise, professional, and information-dense as possible. You may be fed code, documentation, design documents, tutorial documents, READMEs, system setup files, and more, all of which can be extremely important in aiding a programmer gain an understanding of a project/repository. Be sure to include details that are important for understanding how the repository works, such as dependencies, libraries used, important code structures, file formats, and etc. After every message containing a repository file, you will respond with a summary of the file content that was given to you, even if the content was incomplete or only a part of a whole file. The expected format is text or code (ex. you might be fed READMEs). Respond with 'Understood' if you got it."}]
                        },
                        {
                            role: "model",
                            parts: [{ text: "Understood." }]
                        }
                    ]
                })

                for (let file of content.files) {
                    let msg = [];
                    msg.push(file.filename);
                    msg.push(file.content);
                    msg.join("\n");
                    const response = await chat.sendMessage({
                        message: msg
                    });

                    summaries.push({ filename: file.filename, summary: response });
                }
                res.status(200).json({ content: summaries });
            } catch (e) {
                res.status(500).json({ error: "Server error.", content: e.message });
            }
        }
    }
    else {
        res.status(400).json({ error: "Missing 'type' in json data."});
        return;
    }

}