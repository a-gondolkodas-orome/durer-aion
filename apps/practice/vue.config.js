module.exports = {
  filenameHashing: false,
  lintOnSave: false,
  runtimeCompiler: true,
  publicPath: '/durer-jatekok/',
  configureWebpack: {
    module: {
      rules: [
        {
          test: /\.html$/,
          loader: 'html-loader',
          options: {
            esModule: false
          }
        }
      ]
    }
  },
  devServer: {
    port: 8012
  }
};
