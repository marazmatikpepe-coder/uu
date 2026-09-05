/** @type {import('next').NextConfig} */
const isGithubActions = process.env.GITHUB_ACTIONS || false;
let basePath = '';

if (isGithubActions) {
  // Автоматически подставит /<repo-name> при сборке в GitHub Actions.
  // Если деплоишь вручную — впиши сюда имя своего репозитория, например '/nexus-ai'.
  const repo = process.env.GITHUB_REPOSITORY?.replace(/.*?\//, '') || '';
  basePath = `/${repo}`;
}

const nextConfig = {
  output: 'export',        // статический экспорт для GitHub Pages
  basePath,
  images: {
    unoptimized: true,     // GitHub Pages не поддерживает Next Image Optimization
  },
  trailingSlash: true,
};

module.exports = nextConfig;
