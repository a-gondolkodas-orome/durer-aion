const cors = require('cors');

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
          loader: 'html-loader'
        }
      ]
    }
  },
  devServer: {
    port: 8012,
    stats: 'minimal',
    before(app) {
      app.use(cors());
    }
  }
};
