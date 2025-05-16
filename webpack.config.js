const path = require("path");

module.exports = {
  entry: "./src/tf.js",
  output: {
    filename: "tf.js",
    path: path.resolve(__dirname, "dist"),
  },
};
