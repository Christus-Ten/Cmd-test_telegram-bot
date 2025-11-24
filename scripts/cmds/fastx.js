const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { createCanvas, loadImage } = require("canvas");

const aspectRatioMap = {
  "1:1": { width: 1024, height: 1024 },
  "9:7": { width: 1152, height: 896 },
  "7:9": { width: 896, height: 1152 },
  "19:13": { width: 1216, height: 832 },
  "13:19": { width: 832, height: 1216 },
  "7:4": { width: 1344, height: 768 },
  "4:7": { width: 768, height: 1344 },
  "12:5": { width: 1500, height: 625 },
  "5:12": { width: 640, height: 1530 },
  "16:9": { width: 1344, height: 756 },
  "9:16": { width: 756, height: 1344 },
  "2:3": { width: 768, height: 1152 },
  "3:2": { width: 1152, height: 768 },
};

const nix = {
  name: "fastx",
  version: "1.2",
  description: "Generate AI images in a 2x2 grid from a prompt.",
  author: "Christus x Aesther",
  prefix: false,
  category: "ai",
  type: "anyone",
  cooldown: 5,
  guide: "{p}fastx <prompt> [--ar <ratio>]",
};

async function downloadImage(url, filepath) {
  const response = await axios({
    url,
    method: "GET",
    responseType: "stream",
  });
  const writer = fs.createWriteStream(filepath);
  response.data.pipe(writer);
  return new Promise((resolve, reject) => {
    writer.on("finish", resolve);
    writer.on("error", reject);
  });
}

async function generateCombinedImage(imagePaths) {
  const loadedImages = await Promise.all(imagePaths.map((img) => loadImage(img)));
  const width = loadedImages[0].width;
  const height = loadedImages[0].height;

  const canvas = createCanvas(width * 2, height * 2);
  const ctx = canvas.getContext("2d");

  ctx.drawImage(loadedImages[0], 0, 0, width, height);
  ctx.drawImage(loadedImages[1], width, 0, width, height);
  ctx.drawImage(loadedImages[2], 0, height, width, height);
  ctx.drawImage(loadedImages[3], width, height, width, height);

  const combinedPath = path.join(__dirname, "fastx_combined.jpg");
  fs.writeFileSync(combinedPath, canvas.toBuffer("image/jpeg"));
  return combinedPath;
}

async function onStart({ bot, message, chatId, args }) {
  if (!args.length) {
    return message.reply(`❗ Please provide a prompt.\nUsage: /fastx <prompt> [--ar <ratio>]`);
  }

  let prompt = "";
  let ratio = "1:1";

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--ar" && args[i + 1]) {
      ratio = args[i + 1];
      i++;
    } else {
      prompt += args[i] + " ";
    }
  }

  prompt = prompt.trim();

  if (!aspectRatioMap[ratio]) {
    return message.reply(`❌ Invalid aspect ratio. Available: ${Object.keys(aspectRatioMap).join(", ")}`);
  }

  const waitMsg = await message.reply(`🤖 Generating images for: "${prompt}" with ratio ${ratio}...`);

  try {
    const generateUrl = (p, r) =>
      `https://www.ai4chat.co/api/image/generate?prompt=${encodeURIComponent(p)}&aspect_ratio=${encodeURIComponent(r)}`;

    const cacheFolder = path.join(__dirname, "tmp");
    if (!fs.existsSync(cacheFolder)) fs.mkdirSync(cacheFolder);

    const imagePaths = [];
    for (let i = 0; i < 4; i++) {
      const { data } = await axios.get(generateUrl(prompt, ratio));
      if (!data.image_link) throw new Error("API did not return image link.");

      const imgPath = path.join(cacheFolder, `fastx_${i + 1}.jpg`);
      await downloadImage(data.image_link, imgPath);
      imagePaths.push(imgPath);
    }

    const combinedImagePath = await generateCombinedImage(imagePaths);

    await bot.editMessageText(`✨ Generated images for:\n${prompt}\nAspect Ratio: ${ratio}`, {
      chat_id: chatId,
      message_id: waitMsg.message_id,
    });

    await bot.sendPhoto(chatId, combinedImagePath);

    // Cleanup files
    imagePaths.forEach((p) => fs.unlinkSync(p));
    fs.unlinkSync(combinedImagePath);

  } catch (err) {
    console.error("Fastx Command Error:", err.message);

    await bot.editMessageText(`❌ Failed to generate images: ${err.message}`, {
      chat_id: chatId,
      message_id: waitMsg.message_id,
    });
  }
}

module.exports = { nix, onStart };
