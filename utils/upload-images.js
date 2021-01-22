var FormData = require('form-data');
const fs = require('fs');
const fetch = require('node-fetch');

module.exports = async function uploadImages(images) {
  console.log("☁️ Uploading images to Cloudinary...");

	return await Promise.all(
    images.map(async (imgPath) => {
      const formData = new FormData();
      formData.append("file", fs.createReadStream(imgPath));
      formData.append("upload_preset", "michael_mangialardi");

      const options = {
        method: "POST",
        body: formData,
      };
      const apiBase = `https://api.Cloudinary.com/v1_1/dpzpn0xkz/image/upload`;
      const resp = await fetch(apiBase, options);
      
      const data = await resp.text();
      const { url } = JSON.parse(data);

      console.log(`🔥 ${imgPath} uploaded to ${url}`);
      
      return url;
    })
  );
}
