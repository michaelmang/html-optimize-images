const axios = require("axios");
const fs = require("fs");

module.exports = function (url, imagePath) {
  axios({
    url,
    responseType: "stream",
  }).then(
    (response) =>
      new Promise((resolve, reject) => {
        response.data
          .pipe(fs.createWriteStream(imagePath, { flags: 'w' }))
          .on("finish", () => resolve())
          .on("error", (e) => reject(e));
      })
  );
};
