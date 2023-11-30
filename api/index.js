const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const fs = require("fs");
const Readable = require('stream').Readable
const path = require('path');



require('dotenv').config();


const port = process.env.WEBPORT;
const apiKey = process.env.API_KEY;
const file = path.join(process.cwd(), 'api/sos.json')


const OpenAI = new (require('openai')).OpenAI({ apiKey });

const createPrompt = (sentence) => "Object in sentence: \"" + sentence + "\" (reply concisely)"

async function getCommand(q) {

    const completion = await OpenAI.chat.completions.create({
        messages: [
            {
                role: "system",
                content: "Output JSON.",
            },
            { role: "user", content: createPrompt('Cho tôi biết thời tiết hôm nay') },
            { role: "assistant", content: "Thời tiết hôm nay" },
            { role: "user", content: createPrompt('Xem YouTube . ') },
            { role: "assistant", content: "YouTube" },
            {
                role: "user",
                content: createPrompt(q)
            },
        ],
        model: "gpt-3.5-turbo-1106",
        response_format: { type: "json_object" },
    });

    const content = JSON.parse(completion.choices[0].message.content);
    console.log(content)
    const obj = Object.keys(content).map(i => {
        if (i.toLowerCase().indexOf("đối tượng") != -1 || i.toLowerCase().indexOf("object") != -1) {
            return content[i];
        }
    }).filter(i => i != null);

    if (obj.length <= 0) return { error: true };

    return { object: obj[0] };
}

app.use(bodyParser.json({ limit: '50mb' }));
app.use(express.static('public'))

app.post('/api/get-command', async (req, res) => {
    res.set({ 'content-type': 'application/json; charset=utf-8' });
    res.send(await getCommand(req.body.text))
})

app.post('/api/get-text-from-voice', async (req, res) => {
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

app.get('/api/sos', async (req, res) => {
    fs.readFile(file, (error, data) => {

        if (error) {
            console.error(error);

            throw err;
        }

        const user = JSON.parse(data);
        console.log(user);


        res.json(user)
    });

})

app.post('/api/sos/true', async (req, res) => {
    fs.writeFile(file, JSON.stringify({ sos: true }), (error) => {
        console.log(error)
    });


    res.json({ error: false })
})

app.post('/api/sos/false', async (req, res) => {
    fs.writeFile(file, JSON.stringify({ sos: false }), (error) => {
        console.log(error)
    });


    res.json({ error: false })
})



app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})