const fs = require('fs');
const { Telegraf } = require('telegraf');
const ytdl = require('ytdl-core-discord');

const bot = new Telegraf('5019891372:AAFr7v9R50XDTD6pArcbZqcPx9JaYOFEVvk');
const chatData = new Map();

bot.start((ctx) => {
    ctx.reply('Hello there! Welcome to my new telegram bot.');
});

bot.on('message', async (ctx) => {
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
    ytdl.downloadFromInfo(info, { quality: formats[i].itag })
        .pipe(fs.createWriteStream('video.mp4'))
        .on('finish', () => {
            ctx.replyWithVideo({ source: fs.createReadStream('video.mp4') });
        });
});

bot.launch();
