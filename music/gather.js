const fs = require("fs");
const path = require("path");

const musicDir = ".";
const output = [];

fs.readdirSync(musicDir).forEach((file, idx) => {
  if (file.endsWith(".mp3")) {
    output.push({
      id: idx + 1, // Add a unique id (array index)
      name: file.replace(/\.mp3$/i, ""),
      url: `music/${file}`,
    });
  }
});

fs.writeFileSync("songs.json", JSON.stringify(output, null, 2));
console.log("songs.json created with", output.length, "songs.");
