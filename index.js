const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const fs = require("fs");
const Readable = require('stream').Readable



require('dotenv').config();



const port = process.env.WEBPORT;
const apiKey = process.env.API_KEY;


const OpenAI = new (require('openai')).OpenAI({ apiKey });

const createPrompt = (sentence) => "Đối tượng của câu và loại câu, thời gian trong câu: \"" + sentence + "\" (trả lời ngắn gọn)"

async function getCommand(q) {

    const completion = await OpenAI.chat.completions.create({
        messages: [
            {
                role: "system",
                content: "Output JSON.",
            },
            { role: "user", content: createPrompt('Cho tôi biết thời tiết hôm nay') },
            { role: "assistant", content: "Thời tiết hôm nay" },
            {
                role: "user",
                content: createPrompt(q)
            },
        ],
        model: "gpt-3.5-turbo-1106",
        response_format: { type: "json_object" },
    });

    const content = JSON.parse(completion.choices[0].message.content);
    const obj = Object.keys(content).map(i => {
        if (i.toLowerCase().indexOf("đối tượng") != -1) {
            return content[i];
        }
    }).filter(i => i != null);

    if (obj.length <= 0) return { error: true };

    return { object: obj[0] };
}

app.use(bodyParser.json({ limit: '50mb' }));

app.post('/get-command', async (req, res) => {
    res.set({ 'content-type': 'application/json; charset=utf-8' });
    res.send(await getCommand(req.body.text))
})

app.post('/get-text-from-voice', async (req, res) => {
    res.set({ 'content-type': 'application/json; charset=utf-8' });

    const imgBuffer = Buffer.from(req.body.audio, 'base64')
    const s = new Readable()

    s.push(imgBuffer)
    s.push(null)

    const url = 'https://api.fpt.ai/hmi/asr/general';

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            api_key: process.env.FPT_API,

        },
        body: s.read()
    })

    const jsonBody = await response.json()


    if (jsonBody.status == 0)
        res.send({ ok: true, hypotheses: jsonBody.hypotheses })
    else
        res.send({ ok: false })

})


app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})