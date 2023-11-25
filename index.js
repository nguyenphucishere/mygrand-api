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

async function main(q) {

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

    return completion.choices[0].message.content;
}

app.use(bodyParser.json({ limit: '50mb' }));

app.post('/', async (req, res) => {
    console.log(req.body)
    res.set({ 'content-type': 'application/json; charset=utf-8' });

    const imgBuffer = Buffer.from(req.body.audio, 'base64')
    const s = new Readable()

    s.push(imgBuffer)
    s.push(null)

    s.pipe(fs.createWriteStream("test.mp4"));

    const ai_res = await main(req.body.q);

    res.end(ai_res)

})


app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})