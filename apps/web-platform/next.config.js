//@ts-check

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { composePlugins, withNx } = require('@nx/next');

/**
 * @type {import('@nx/next/plugins/with-nx').WithNxOptions}
 **/
const nextConfig = {
  // Standalone output gera uma pasta self-contained para deploy em container
  output: 'standalone',
  // Use this to set Nx-specific options
  // See: https://nx.dev/recipes/next/next-config-setup
  nx: {},
};

// Em ambiente Docker/CI o withNx tenta criar o project graph e falha
// quando o workspace-data não está disponível. Nesses casos exportamos
// a config diretamente sem o plugin Nx.
if (process.env.DOCKER_BUILD === 'true') {
  const { nx: _nx, ...nextConfigWithoutNx } = nextConfig;
  module.exports = nextConfigWithoutNx;
} else {
  const plugins = [withNx];
  module.exports = composePlugins(...plugins)(nextConfig);
}
