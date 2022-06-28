module.exports = {
  filenameHashing: false,
  lintOnSave: false,
  runtimeCompiler: true,
  publicPath: process.env.NODE_ENV === 'production' ? '/durer-jatekok/' : '/',
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
