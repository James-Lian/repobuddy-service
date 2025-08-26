import { GoogleGenAI } from "@google/genai";

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY
const AI = new GoogleGenAI({apiKey: GOOGLE_API_KEY});

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
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
                
                const chat = AI.chats.create({
                    model: "gemini-2.5-flash",
                    history: content.history
                });
    
                const stream = await chat.sendMessageStream({
                    message: content.message,
                });
                
                for await (const chunk of stream) {
                    res.write(chunk.text);
                }
                res.end();
            } catch (e) {
                console.log(e);
                res.status(500).json({ error: "Server error.", content: e });
            }
        }
    }
    else {
        res.status(400).json({ error: "Missing 'type' in json data."});
        return;
    }

}