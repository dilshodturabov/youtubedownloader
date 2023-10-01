const { Telegraf } = require('telegraf');
const ytdl = require('ytdl-core-discord');
const express = require('express');
const app = express();

app.get('/',(req, res)=>{
    res.send('Hello world');
});

const port = 3000;
app.listen(port,()=>{
  console.log(`Server is running localhost:${port}`);
});

const bot = new Telegraf('5019891372:AAFr7v9R50XDTD6pArcbZqcPx9JaYOFEVvk');
const chatData = new Map();

bot.start((ctx) => {
    ctx.reply('Hello there! Welcome to my telegram bot.');
});

bot.on('message', async (ctx) => {
    ctx.reply('Downloading...')
    let url = ctx.message.text;
    if(ytdl.validateURL(url)) {
        let info = await ytdl.getInfo(url);
        let formats = ytdl.filterFormats(info.formats, 'videoandaudio');
        chatData.set(ctx.chat.id, { info, formats });
        let inlineKeyboard = formats.map((format, i) => [{ text: format.qualityLabel, callback_data: String(i) }]);
        ctx.reply('Please choose a quality:', { reply_markup: { inline_keyboard: inlineKeyboard } });
    } else {
        ctx.reply('Please provide a valid YouTube URL.');
    }
});

bot.on('callback_query', (ctx) => {
    let i = parseInt(ctx.callbackQuery.data);
    let { info, formats } = chatData.get(ctx.chat.id);
    ctx.reply('Downloading...');
    const streamOptions = { seek: 0, volume: 1 };
    const stream = ytdl.downloadFromInfo(info, { quality: formats[i].itag });
    ctx.replyWithVideo({ source: stream });
});

console.log('now bot is working...')
bot.launch();
