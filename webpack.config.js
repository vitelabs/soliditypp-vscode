const path = require("path");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
module.exports = {
  entry: path.resolve(__dirname, "src/extension.ts"),
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: {
          loader: "ts-loader"
        }
      }
    ]
  },
  output: {
    path: path.resolve(__dirname, "out"),
    filename: "extension.js",
    libraryTarget: "commonjs2"
  },
  resolve: {
    extensions: [".ts", ".js"]
  },
  externals: {
    vscode: "commonjs vscode"
  },
  plugins: [new CleanWebpackPlugin()],
  target: "node",
  node: {
    __dirname: false
  }
};
