const axios = require("axios");
const fs = require("fs");
const path = require("path");
const ytSearch = require("yt-search");

const nix = {
name: "sing",
version: "0.0.1",
aliases: ["music", "song"],
description: "Searches and sends music/songs from YouTube.",
author: "ArYAN",
prefix: false,
category: "music",
type: "anyone",
cooldown: 5,
guide: "{p}sing <song name> [audio/video]",
};

async function onStart({ bot, message, msg, chatId, args }) {
let songName;
let downloadType = "audio";

if (args.length === 0) {
return message.reply("Please provide a song name to search for. \nUsage: {p}sing <song name> [audio/video]");
}

const lastArg = args[args.length - 1].toLowerCase();
if (lastArg === "audio" || lastArg === "video") {
downloadType = lastArg;
songName = args.slice(0, -1).join(" ");
} else {
songName = args.join(" ");
}

if (!songName) {
return message.reply("Please provide a song name to search for.");
}

const processingMessage = await message.reply("🎵 Searching and preparing your song...");

try {
const searchResults = await ytSearch(songName);
if (!searchResults || !searchResults.videos.length) {
await bot.editMessageText("❌ No results found for your search query.", {
chat_id: chatId,
message_id: processingMessage.message_id
});
return;
}

const topResult = searchResults.videos[0];  
const videoId = topResult.videoId;  
const songTitle = topResult.title;  

const apiKey = "itzaryan";  
const apiUrl = `https://xyz-nix.vercel.app/aryan/youtube?id=${videoId}&type=${downloadType}&apikey=${apiKey}`;  

await bot.editMessageText(`⏳ Found "${songTitle}". Downloading...`, {  
  chat_id: chatId,  
  message_id: processingMessage.message_id  
});  

const downloadResponse = await axios.get(apiUrl);  
const downloadUrl = downloadResponse.data.downloadUrl;  

if (!downloadUrl) {  
  throw new Error("Failed to get download URL from the API.");  
}  

const response = await axios({  
  method: 'get',  
  url: downloadUrl,  
  responseType: 'stream'  
});  

const fileExtension = downloadType === "audio" ? "mp3" : "mp4";  
const filename = `${songTitle.replace(/[^a-zA-Z0-9]/g, '_')}.${fileExtension}`;  
const downloadPath = path.join(__dirname, filename);  

const writer = fs.createWriteStream(downloadPath);  
response.data.pipe(writer);  

await new Promise((resolve, reject) => {  
  writer.on('finish', resolve);  
  writer.on('error', reject);  
});  

await bot.editMessageText(`✅ Downloaded "${songTitle}". Sending...`, {  
  chat_id: chatId,  
  message_id: processingMessage.message_id  
});  

if (downloadType === "audio") {  
  await bot.sendAudio(chatId, downloadPath, {  
    caption: `${songTitle}`,  
    parse_mode: 'Markdown',  
  }, {  
    filename: filename  
  });  
} else {  
  await bot.sendVideo(chatId, downloadPath, {  
    caption: `${songTitle}`,  
    parse_mode: 'Markdown',  
  }, {  
    filename: filename  
  });  
}  

fs.unlinkSync(downloadPath);  
await bot.deleteMessage(chatId, processingMessage.message_id);

} catch (error) {
console.error(Error in sing command: ${error.message});
if (processingMessage && processingMessage.message_id) {
await bot.deleteMessage(chatId, processingMessage.message_id).catch(e => console.error("Failed to delete processing message:", e));
}
await message.reply(⚠️ Failed to download or send song: ${error.message});
}
}

module.exports = { nix, onStart };
