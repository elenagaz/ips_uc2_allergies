// vue.config.js
module.exports = {
  devServer: {
    proxy: {
      '/proxy': {
        target: 'http://localhost:5000',  // Backend server
        changeOrigin: true,
        secure: false,
      },
    },
  },
};
