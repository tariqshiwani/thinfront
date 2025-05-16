const path = require("path");

module.exports = {
  entry: "./src/tf.js",
  output: {
    filename: "tf.min.js",
    path: path.resolve(__dirname, "dist"),
  },
};
