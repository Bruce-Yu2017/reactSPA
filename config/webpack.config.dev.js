'use strict'

const autoprefixer = require('autoprefixer');
const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin');
// const InterpolateHtmlPlugin = require('react-dev-utils/InterpolateHtmlPlugin');
// const WatchMissingNodeModulesPlugin = require('react-dev-utils/WatchMissingNodeModulesPlugin');
const eslintFormatter = require('react-dev-utils/eslintFormatter');
const ModuleScopePlugin = require('react-dev-utils/ModuleScopePlugin');
const getClientEnvironment = require('./env');
const paths = require('./paths');

const publicPath = '/';

const publicUrl = '';
const env = getClientEnvironment(publicUrl);

// 优先速度
module.exports = {
  mode: 'development',
  devtool: 'cheap-module-source-map', // https://webpack.js.org/configuration/devtool/
  entry: [
    require.resolve('webpack-dev-server/client') + '?/',
    require.resolve('webpack/hot/dev-server'),
    // require.resolve('react-dev-utils/webpackHotDevClient'), // 这句和上面两句写法二选一
    require.resolve('./polyfills'),
    require.resolve('react-error-overlay'), // 开发报错，将导致启动不了
    paths.appIndexJs,
  ],
  output: { // https://doc.webpack-china.org/configuration/output/
    path: paths.appBuild, // 开发环境这句没用，但是生成环境要用
    pathinfo: true, // 告诉 webpack 在 bundle 中引入「所包含模块信息」的相关注释，开发环境用
    filename: 'static/js/bundle.js', // 这不是真实的文件，其仅仅是在开发环境下由 WebpackDevServer 提供的一个虚拟路径
    chunkFilename: 'static/js/[name].chunk.js', // 使用了 code splitting 后其它的 chunk 文件
    publicPath: publicPath,
    devtoolModuleFilenameTemplate: info =>
      path.resolve(info.absoluteResourcePath).replace(/\\/g, '/'),
  },
  resolve: {
    modules: ['node_modules', paths.appNodeModules].concat( // 设置寻找模块的先后机制
      process.env.NODE_PATH.split(path.delimiter).filter(Boolean)
    ),
    extensions: ['.js', '.json', '.jsx'],
    alias: {
      components: path.resolve(__dirname, '..') + '/src/common/components',
      container: path.resolve(__dirname, '..') + '/src/common/container',
      images: path.resolve(__dirname, '..') + '/src/common/images',
      pages: path.resolve(__dirname, '..') + '/src/common/pages',
      utils: path.resolve(__dirname, '..') + '/src/common/utils',
      data: path.resolve(__dirname, '..') + '/src/server/data',
      actions: path.resolve(__dirname, '..') + '/src/common/actions',
      reducers: path.resolve(__dirname, '..') + '/src/common/reducers',
      api: path.resolve(__dirname, '..') + '/src/common/api',
    },
    plugins: [
      new ModuleScopePlugin(paths.appSrc, [paths.appPackageJson]), // 该插件把模块作用域限制在 src 和 node_module 中
    ],
  },

  module: { // https://doc.webpack-china.org/configuration/module/
    strictExportPresence: true,
    rules: [
      // 在 babel 解析前进行 eslint 校验
      {
        test: /\.(js|jsx)$/,
        enforce: 'pre',
        use: [
          {
            options: {
              formatter: eslintFormatter,
              eslintPath: require.resolve('eslint'),

            },
            loader: require.resolve('eslint-loader'),
          },
        ],
        include: paths.appSrc,
      },
      {
        // 使用第一个规则匹配
        oneOf: [
          {
            test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
            loader: require.resolve('url-loader'),
            options: {
              limit: 10000,
              name: 'static/media/[name].[hash:8].[ext]',
            },
          },
          {
            test: /\.(js|jsx)$/,
            include: paths.appSrc,
            loader: require.resolve('babel-loader'),
            options: {
              // 缓存在 ./node_modules/.cache/babel-loader/，从而能更快地 rebuild，
              cacheDirectory: true, // 可能项目大了以后该属性有影响
              plugins: [
                "transform-decorators-legacy",
                ['import', { libraryName: 'antd', style: true }],  // import less
              ],
            },
          },
          {
            test: /\.css$/,
            use: [
              // "style" loader turns CSS into JS modules that inject <style> tags.
              require.resolve('style-loader'),
              {
                // "css" loader resolves paths in CSS and adds assets as dependencies.
                loader: require.resolve('css-loader'),
                options: {
                  importLoaders: 1,
                },
              },
              {
                // "postcss" loader applies autoprefixer to our CSS.
                loader: require.resolve('postcss-loader'),
                options: {
                  ident: 'postcss',
                  plugins: () => [
                    require('postcss-flexbugs-fixes'),
                    autoprefixer({
                      browsers: [
                        '>1%',
                        'last 4 versions',
                        'Firefox ESR',
                        'not ie < 9', // React doesn't support IE8 anyway
                      ],
                      flexbox: 'no-2009',
                    }),
                  ],
                },
              },
            ],
          },
          {
            test: /\.less$/,
            use: [
              require.resolve('style-loader'),
              require.resolve('css-loader'),
              {
                loader: require.resolve('postcss-loader'),
                options: {
                  ident: 'postcss', // https://webpack.js.org/guides/migrating/#complex-options
                  plugins: () => [
                    require('postcss-flexbugs-fixes'),
                    autoprefixer({
                      browsers: [
                        '>1%',
                        'last 4 versions',
                        'Firefox ESR',
                        'not ie < 9', // React doesn't support IE8 anyway
                      ],
                      flexbox: 'no-2009',
                    }),
                  ],
                },
              },
              {
                loader: require.resolve('less-loader'),
                options: {
                  modifyVars: { "@primary-color": "#1890ff" },
                },
              },
            ],
          },
          // 如果还要加 loader，请加到 file-loader 之前
          {
            exclude: [/\.js$/, /\.html$/, /\.json$/, /\.less$/,],
            loader: require.resolve('file-loader'),
            options: {
              name: 'static/media/[name].[hash:8].[ext]',
            },
          },
        ],
      },
    ],
  },
  plugins: [
    // 这个插件允许我们在 index.html 中使用自定义变量
    // new InterpolateHtmlPlugin(env.raw),
    // 将 Webpack 打包生成的 bundles 插入 HTML 中 script 标签中
    new HtmlWebpackPlugin({
      inject: true,
      template: paths.appHtml,
    }),
    // 当开启 HMR 的时候使用该插件会显示模块的相对路径，建议用于开发环境。作用没理解~
    // new webpack.NamedModulesPlugin(),
    // 区别开发模式和发布模式的全局变量
    new webpack.DefinePlugin(env.stringified),
    // This is necessary to emit hot updates (currently CSS only):
    new webpack.HotModuleReplacementPlugin(),
    // 防止大小写错误
    new CaseSensitivePathsPlugin(),
    // 在 npm install 新的依赖后自动刷新
    // new WatchMissingNodeModulesPlugin(paths.appNodeModules),
    // 优化 moment.js 库的体积，https://github.com/jmblog/how-to-optimize-momentjs-with-webpack
    new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
  ],
  // 将一些在浏览器不起作用，但是引用到的库置空
  node: {
    dgram: 'empty',
    fs: 'empty',
    net: 'empty',
    tls: 'empty',
  },
  // Turn off performance hints during development because we don't do any
  // splitting or minification in interest of speed. These warnings become
  // cumbersome.
  performance: {
    hints: false,
  },
};