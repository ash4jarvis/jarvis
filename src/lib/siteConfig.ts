const DEFAULT_REPOSITORY = "https://github.com/ash4jarvis/jarvis";
const configuredRepository = import.meta.env.VITE_GITHUB_REPO as string | undefined;
const configuredReleases = import.meta.env.VITE_GITHUB_RELEASES_URL as string | undefined;

function safeGitHubUrl(value: string | undefined, fallback: string) {
  try {
    const url = new URL(value || fallback);
    if (url.protocol !== "https:" || url.hostname !== "github.com" || url.username || url.password) return fallback;
    return url.toString().replace(/\/$/, "");
  } catch { return fallback; }
}

export const repositoryUrl = safeGitHubUrl(configuredRepository, DEFAULT_REPOSITORY);
export const releasesUrl = safeGitHubUrl(configuredReleases, `${repositoryUrl}/releases`);
export const supportUrl = `${repositoryUrl}/issues`;
