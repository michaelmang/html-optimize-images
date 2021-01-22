const fs = require("fs");
const puppeteer = require("puppeteer");
const rimraf = require("rimraf");

const downloadImage = require("./utils/download-image");
const optimizeImages = require("./utils/optimize-images");
const pipe = require("./utils/pipe");
const uploadImages = require("./utils/upload-images");

const ASSETS_DIR = `${process.cwd()}/assets`;

const blacklist = ["gif"];
const whitelist = ["user-images.githubusercontent"];

let count = 0;

function getImagePath(dataUrlImg) {
  count = count + 1;

  const matchEverythingBeforeFileType = /.*(?=\.png)/gm;
  const fileName = dataUrlImg.replace(
    matchEverythingBeforeFileType,
    `${count}`
  );

  return `${ASSETS_DIR}/${fileName}`;
}

function trashAllAssets() {
  console.log("🗑️ Trashing all assets before run...\n");

  rimraf.sync(ASSETS_DIR);

  fs.mkdirSync(ASSETS_DIR);
  fs.mkdirSync(`${ASSETS_DIR}/optimized`);

  console.log("️✅  All assets successfully trashed.\n");
}

async function init(uri) {
  // trashAllAssets();

  console.log("🚀 Launching the web page...\n");

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(uri);

  console.log("️✅  Web page launched.\n");

  return [browser, page];
}

async function getDataUrlImages(page) {
  console.log("📷 Extracting image sources...\n");

  return await page.$$eval(
    "img",
    (imgs, whitelist, blacklist) => {
      return imgs
        .map((img) => img.src)
        .filter(
          (src) =>
            whitelist.some((x) => src.includes(x)) &&
            blacklist.some((x) => !src.includes(x))
        );
    },
    whitelist,
    blacklist
  );
}

async function downloadImages(dataUrlImages) {
  console.log("️✅  All image sources successfully extracted.\n");

  let result = [];

  console.log("Downloading all images from sources...\n");

  dataUrlImages.forEach((dataUrlImg) => {
    const imagePath = getImagePath(dataUrlImg);

    result.push(imagePath);

    downloadImage(dataUrlImg, imagePath);
  });

  console.log("️✅  All images successfully downloaded.\n");

  return result;
}

async function compressImages(images) {
  console.log("️🗜️ Optimizing all images...\n");
  optimizeImages(images);

  return images.map((imgPath) => imgPath.replace("assets", "assets/optimized"));
}

const getHtmlWithOptimizedImages = (page) => async (urls) => {
  console.log("Extracting HTML with optimized images...\n");

  await page.$$eval(
    "img",
    (imgs, whitelist, blacklist, urls) => {
      return imgs.filter(
        (img) =>
          whitelist.some((x) => img.src.includes(x)) &&
          blacklist.some((x) => !img.src.includes(x))
      ).forEach((img, idx) => {
        img.src = urls[idx];
      });
    },
    whitelist,
    blacklist,
    urls,
  );

  return await page.$eval("main", (elem) => elem.outerHTML);
}

async function main() {
  const [browser, page] = await init(process.argv.slice(2).pop());

  const getHtml = getHtmlWithOptimizedImages(page);

  const html = await pipe(getDataUrlImages, downloadImages, compressImages, uploadImages, getHtml)(page);

  console.log(html)

  fs.writeFileSync("post.html", html);

  console.log("️📸  All images optimized successfully. HTML written to post.html.");

  await browser.close();
}

main();
