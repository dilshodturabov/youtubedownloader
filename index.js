require('dotenv').config();
const { Telegraf } = require('telegraf');
const ytdl = require('ytdl-core-discord');
const http = require('http');
http.createServer((req, res) => {
    res.write('alive');
    res.end();
}).listen(2003);


const bot = new Telegraf(process.env.BOT_TOKEN);
const chatData = new Map();

bot.start((ctx) => {
    ctx.reply('Hello there! Welcome to my telegram bot. Send a Valid YouTube URL!');
});

bot.on('message', async (ctx) => {
    let url = ctx.message.text;
    if (ytdl.validateURL(url)) {
        try {
            let info = await ytdl.getInfo(url);
            let videoFormats = ytdl.filterFormats(info.formats, 'videoandaudio');
            let audioFormats = ytdl.filterFormats(info.formats, 'audioonly');
            chatData.set(ctx.chat.id, { info, videoFormats, audioFormats });
            let videoInlineKeyboard = videoFormats.map((format, i) => [{ text: format.qualityLabel, callback_data: 'v' + String(i) }]);
            let audioInlineKeyboard = audioFormats.map((format, i) => [{ text: format.audioBitrate + 'kbps', callback_data: 'a' + String(i) }]);
            let chooseQualityMessage = await ctx.reply('Please choose a video or audio quality:', { reply_markup: { inline_keyboard: [...videoInlineKeyboard, ...audioInlineKeyboard] } });
            chatData.set(ctx.chat.id, { ...chatData.get(ctx.chat.id), chooseQualityMessage });
        } catch (error) {
            console.error(error);
            ctx.reply('An error occurred while processing your request. Please try again.');
        }
    } else {
        ctx.reply('Please provide a valid YouTube URL. 🔗');
    }
});

bot.on('callback_query', async (ctx) => {
    let type = ctx.callbackQuery.data.charAt(0);
    let i = parseInt(ctx.callbackQuery.data.substr(1));
    let { info, videoFormats, audioFormats, chooseQualityMessage } = chatData.get(ctx.chat.id);
    try {
        let downloadingMessage = await ctx.reply('Downloading...📥');
        const streamOptions = { seek: 0, volume: 1 };
        const stream = ytdl.downloadFromInfo(info, { quality: (type === 'v' ? videoFormats[i] : audioFormats[i]).itag });
        if (type === 'v') {
            await ctx.replyWithVideo({ source: stream, filename: info.videoDetails.title + '.mp4' });
        } else {
            await ctx.replyWithAudio({ source: stream, filename: info.videoDetails.title + '.mp3' });
        }
        await ctx.telegram.deleteMessage(ctx.chat.id, downloadingMessage.message_id);
        await ctx.telegram.deleteMessage(ctx.chat.id, chooseQualityMessage.message_id);
    } catch (error) {
        console.error(error);
        ctx.reply('An error occurred while processing your request. Please try again.');
    }
});

console.log('now bot is working...')
bot.launch();
