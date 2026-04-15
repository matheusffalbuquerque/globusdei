const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
const { join } = require('path');

// Dependências que NÃO devem ser bundladas (têm addons nativos ou são muito grandes)
const nodeExternals = [
  'mongoose',
  'bson',
  'mongodb',
  'mongodb-client-encryption',
  'kerberos',
  '@mongodb-js/zstd',
  '@aws-sdk/credential-providers',
  'snappy',
];

module.exports = {
  output: {
    path: join(__dirname, '../../dist/apps/data-service'),
    clean: true,
    ...(process.env.NODE_ENV !== 'production' && {
      devtoolModuleFilenameTemplate: '[absolute-resource-path]',
    }),
  },
  externals: nodeExternals.reduce((acc, pkg) => {
    acc[pkg] = `commonjs ${pkg}`;
    return acc;
  }, {}),
  plugins: [
    new NxAppWebpackPlugin({
      target: 'node',
      compiler: 'tsc',
      main: './src/main.ts',
      tsConfig: './tsconfig.app.json',
      assets: ['./src/assets'],
      optimization: false,
      outputHashing: 'none',
      generatePackageJson: true,
      sourceMap: true,
    }),
  ],
};
