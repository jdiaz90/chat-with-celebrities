import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const devPort = process.env.WEBPACK_PORT || 3000;
const apiProxy = process.env.API_PROXY || 'http://localhost:7500';

export default {
  entry: './public/src/js/main.js', // tu JS principal
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'public/dist'),
    publicPath: '/dist/',
    clean: true
  },
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: [
          MiniCssExtractPlugin.loader, // extrae el CSS en archivo físico
          'css-loader'
        ],
      },
      {
        // Ejemplo para imágenes estáticas si las importas desde JS o CSS
        test: /\.(png|jpe?g|gif|svg)$/i,
        type: 'asset/resource'
      }
    ],
  },
  plugins: [
    new MiniCssExtractPlugin({
      // CSS generado: public/css/style.css
      filename: '../css/style.css'
    })
  ],
  mode: 'development', // o 'production' para build final
  devServer: {
    static: {
      directory: path.join(__dirname, 'public')
    },
    port: devPort,
    hot: true,
    historyApiFallback: true,
    devMiddleware: {
      writeToDisk: true // 👈 importante para ver el .css en disco en desarrollo
    },
    proxy: [
      {
        context: ['/stream'],
        target: apiProxy,
        changeOrigin: true
      }
    ]
  }
};
