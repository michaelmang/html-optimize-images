const fs = require('fs');
const Jimp = require('jimp');

function getFileSize(path) {
  const stats = fs.statSync(path);
  const fileSizeInBytes = stats.size;
  return fileSizeInBytes / (1024*1024);
}

function getOptimization(origImgPath, optimizedImgPath) {
  const result = (getFileSize(origImgPath) / getFileSize(optimizedImgPath)) * 100;
  return `${Math.round(result)}%`;
}

module.exports = async (images, width = 1200, height = Jimp.AUTO, quality = 60) => {
	await Promise.all(
		images.map(async imgPath => {
      const image = await Jimp.read(imgPath);
			image.resize(width, height);
      image.quality(quality);
      const outputImgPath = `${imgPath.replace("assets", "assets/optimized")}`;
      image.write(outputImgPath);
      
      console.log(`🔥 ${imgPath} optimized by ${getOptimization(imgPath, outputImgPath)}\n`);
		})
	);
};