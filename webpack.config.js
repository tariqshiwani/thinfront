const path = require("path");

module.exports = {
  mode: "production",
  entry: "./src/tf.js",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "tf.min.js",
  },
  optimization: {
    minimize: true,
    minimizer: [
      (compiler) => {
        const TerserPlugin = require("terser-webpack-plugin");
        new TerserPlugin({
          include: /\.min\.js$/,
        }).apply(compiler);
      },
    ],
  },
};
