import { getImageBySentence, getSentence } from "../src/get-up";
import type { Response } from "../src/types";
import path from "path";
import fs from "fs";
import stream from "stream";
import { promisify } from "util";

const pipeline = promisify(stream.pipeline);

// const prompts = [
//   // Oil painting style:
//   'Inspired by the Chinese ancient poem "$title$", create an oil painting-style artwork that reflects the poetic charm and characters.',
//   // Realistic style:
//   'Using the Chinese ancient poem "$title$" as the source of inspiration, draw a realistic-style picture that highlights the scene details and atmosphere.',
//   // Cyberpunk style:
//   'Combine the Chinese ancient poem "$title$" with cyberpunk elements to design a unique image blending tradition and sci-fi.',
// ];
const prompt =
  '请根据给定的古诗句"$title$"创作一张插图，展示出诗句所描述的场景，并表现出诗句深层的主题含义。';
// '请根据"$title$"这句诗对应的主题、意境、情感、艺术手法作为背景绘制图片';
async function init() {
  const cwd = process.cwd();

  const argv = require("minimist")(process.argv.slice(2));
  const cookie = argv.cookie;

  const createImagePromises = Array(4)
    .fill("")
    .map(async () => {
      const sentence = await getSentence();

      console.log("getSentence Result: ", sentence);
      sentence.content = prompt.replace("$title$", sentence.content);
      const res: Response = await getImageBySentence(cookie, sentence);
      console.log("Create Successful: ", res);

      const outputPath = path.join(cwd, "public");

      const imagesPath = path.join(outputPath, "images");
      if (!fs.existsSync(imagesPath)) {
        fs.mkdirSync(imagesPath);
      }

      const imagesFolderName = Date.now().toString();
      const imagesFolderPath = path.join(imagesPath, imagesFolderName);
      if (!fs.existsSync(imagesFolderPath)) {
        fs.mkdirSync(imagesFolderPath);
      }
      await writeContent(res, imagesFolderName);
      console.log("writeContent success: ", imagesFolderName);

      const downImagePromises = res.images.map((image, index) => {
        const imageFileName = `${index}.jpg`;
        const imageFilePath = path.join(imagesFolderPath, imageFileName);

        return fetch(image).then((res) => {
          if (!res.ok) throw new Error(`unexpected response ${res.statusText}`);
          // @ts-ignore
          pipeline(res.body, fs.createWriteStream(imageFilePath)).catch((e) => {
            console.error("Something went wrong while saving the image", e);
          });
        });
      });
      return Promise.all(downImagePromises);
    });
  await Promise.all(createImagePromises);
  console.log("createImages success");
  process.exit(0);
}

function writeContent(res, imagesFolderName) {
  const cwd = process.cwd();
  const contentPath = path.join(cwd, "public/content");
  return new Promise((resolve) => {
    const options = { timeZone: "Asia/Shanghai", hour12: false };
    const outputData = {
      ...res,
      date: new Date().toLocaleString("zh-CN", options),
      localImagesPath: imagesFolderName,
    };
    const contentFile = path.join(contentPath, `${imagesFolderName}.json`);
    console.log({ contentFile, contentPath });
    fs.writeFileSync(contentFile, JSON.stringify(outputData));
    resolve(true);
  });
}
// writeContent({ a: "s" }, "aaaa");

init().catch((e) => {
  console.error(e);
});
