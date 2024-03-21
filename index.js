const { Telegraf } = require('telegraf');
const ytdl = require('ytdl-core-discord');
const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('Hello world this is backend site of my telegram bot if you want to see my bot visit this https://t.me/adt_mymusicbot');
});

const port = 2003;
app.listen(port, () => {
  console.log(`Server is running localhost:${port}`);
});

const bot = new Telegraf('7070285822:AAF4BuaKERRPYFKIdKLb-ngLlf908hg10Rk');
const chatData = new Map();

bot.start((ctx) => {
  ctx.reply('Hello there! Welcome to my telegram bot. Send a Valid YouTube URL!');
});

bot.on('message', async (ctx) => {
  let url = ctx.message.text;
  if (ytdl.validateURL(url)) {
    let info = await ytdl.getInfo(url);
    let videoFormats = ytdl.filterFormats(info.formats, 'videoandaudio');
    let audioFormats = ytdl.filterFormats(info.formats, 'audioonly');
    chatData.set(ctx.chat.id, { info, videoFormats, audioFormats });
    let videoInlineKeyboard = videoFormats.map((format, i) => [{ text: format.qualityLabel, callback_data: 'v' + String(i) }]);
    let audioInlineKeyboard = audioFormats.map((format, i) => [{ text: format.audioBitrate + 'kbps', callback_data: 'a' + String(i) }]);
    // Store the message returned by ctx.reply
    let chooseQualityMessage = await ctx.reply('Please choose a video or audio quality:', { reply_markup: { inline_keyboard: [...videoInlineKeyboard, ...audioInlineKeyboard] } });
    chatData.set(ctx.chat.id, { ...chatData.get(ctx.chat.id), chooseQualityMessage });
  } else {
    ctx.reply('Please provide a valid YouTube URL. 🔗');
  }
});



bot.on('callback_query', async (ctx) => {
  let type = ctx.callbackQuery.data.charAt(0);
  let i = parseInt(ctx.callbackQuery.data.substr(1));
  let { info, videoFormats, audioFormats, chooseQualityMessage } = chatData.get(ctx.chat.id);
  // Store the message returned by ctx.reply
  let downloadingMessage = await ctx.reply('Downloading...📥');
  const streamOptions = { seek: 0, volume: 1 };
  const stream = ytdl.downloadFromInfo(info, { quality: (type === 'v' ? videoFormats[i] : audioFormats[i]).itag });
  if (type === 'v') {
    await ctx.replyWithVideo({ source: stream, filename: info.videoDetails.title + '.mp4' });
  } else {
    await ctx.replyWithAudio({ source: stream, filename: info.videoDetails.title + '.mp3' });
  }
  // Remove the 'Downloading...📥' message
  await ctx.telegram.deleteMessage(ctx.chat.id, downloadingMessage.message_id);
  // Remove the 'Please choose a video or audio quality:' message
  await ctx.telegram.deleteMessage(ctx.chat.id, chooseQualityMessage.message_id);
});

console.log('now bot is working...')
bot.launch();
