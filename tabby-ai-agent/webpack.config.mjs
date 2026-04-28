import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default {
  mode: 'production',
  entry: resolve(__dirname, 'src/index.ts'),
  output: {
    path: resolve(__dirname, 'dist'),
    filename: 'index.js',
    library: { type: 'commonjs' },
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: {
          loader: 'ts-loader',
          options: {
            onlyCompileBundledFiles: true,
            transpileOnly: true,
          },
        },
        exclude: /node_modules/,
      },
    ],
  },
  externals: {
    'tabby-core': 'tabby-core',
    'tabby-terminal': 'tabby-terminal',
    '@angular/core': '@angular/core',
    'rxjs': 'rxjs',
    'tabby-settings': 'tabby-settings',
    'tabby-ai-agent/services/context.service': 'tabby-ai-agent/services/context.service',
  },
}
