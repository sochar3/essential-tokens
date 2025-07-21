const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlInlineScriptPlugin = require('html-inline-script-webpack-plugin');
const webpack = require('webpack');

// Determine if we're in development mode
const isDevelopment = process.env.NODE_ENV !== 'production';

// Check if we're building the open source version
const isOpenSource = process.env.BUILD_TYPE === 'opensource';

module.exports = {
  mode: isDevelopment ? 'development' : 'production',
  
  // Add source maps for better debugging
  devtool: isDevelopment ? 'inline-source-map' : false,
  
  entry: {
    ui: './src/ui.tsx',
    code: './code.ts'
  },
  
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    clean: true
  },
  
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: 'ts-loader',
          options: {
            // Skip type checking for faster builds and ignore unused component errors
            transpileOnly: true,
            compilerOptions: {
              noEmit: false
            }
          }
        },
        exclude: [
          /node_modules/,
          // Exclude unused UI components for better tree shaking
          /components\/ui\/(?!button|card|badge|tabs|textarea|scroll-area|utils|theme-toggle|icons).*\.tsx$/
        ]
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader',
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: [
                  require('@tailwindcss/postcss'),
                  require('autoprefixer')
                ]
              }
            }
          }
        ]
      }
    ]
  },
  
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.jsx'],
    alias: {
      '@': path.resolve(__dirname, '.'),
      '@/components': path.resolve(__dirname, 'components')
    }
  },
  
  plugins: [
    // Define environment variables for conditional compilation
    new webpack.DefinePlugin({
      'process.env.BUILD_TYPE': JSON.stringify(process.env.BUILD_TYPE || 'personal'),
      'process.env.IS_OPEN_SOURCE': JSON.stringify(isOpenSource)
    }),
    new HtmlWebpackPlugin({
      template: './ui.html',
      filename: 'ui.html',
      chunks: ['ui'],
      inject: 'body',
      // Conditional minification based on environment
      minify: isDevelopment ? false : {
        removeComments: false, // Keep comments for better readability
        collapseWhitespace: false, // Preserve formatting
        removeRedundantAttributes: true,
        useShortDoctype: true,
        removeEmptyAttributes: true,
        removeStyleLinkTypeAttributes: true,
        keepClosingSlash: true,
        minifyJS: true,
        minifyCSS: false, // Keep CSS readable
        minifyURLs: true,
        // Preserve line breaks and indentation
        preserveLineBreaks: true,
        ignoreCustomComments: [/^\s*\[/],
      },
      // Add meta information to the generated file
      templateParameters: {
        compilation: {
          options: {
            mode: isDevelopment ? 'development' : 'production'
          }
        }
      }
    }),
    new HtmlInlineScriptPlugin({
      // Add formatting options for inlined scripts
      scriptMatchPattern: [/ui\.js$/],
      htmlMatchPattern: [/ui\.html$/],
    })
  ],
  
  externals: {
    // Don't bundle Figma plugin APIs
    'figma': 'figma'
  },
  
  // Enhanced stats configuration
  stats: {
    warnings: isDevelopment, // Show warnings in development
    colors: true,
    modules: false,
    chunks: false,
    children: false,
    entrypoints: false,
    errorDetails: true,
  },
  
  optimization: {
    minimize: !isDevelopment, // Only minimize in production
    // Disable chunk splitting entirely for inline sources
    splitChunks: false,
    // Better module concatenation for readability
    concatenateModules: false,
    // Enable more readable output in development
    ...(isDevelopment && {
      minimizer: [], // No minimizers in development
    }),
    // Keep original names in development for debugging
    ...(isDevelopment && {
      moduleIds: 'named',
      chunkIds: 'named',
    })
  },
  
  // Development server configuration for easier development
  ...(isDevelopment && {
    devServer: {
      static: {
        directory: path.join(__dirname, 'dist'),
      },
      compress: true,
      port: 3000,
      hot: true,
    }
  })
};