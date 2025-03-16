/** @type {import('@babel/core').TransformOptions} */
module.exports = {
  presets: [
    '@babel/preset-env',
    '@babel/preset-react',
    '@babel/preset-typescript',
  ],
  plugins: ['@babel/transform-runtime', 'babel-plugin-transform-import-meta'],
};
