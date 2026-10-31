import { repositoryUrl } from "@/lib/siteConfig";

export type GitHubReleaseAsset = {
  name: string;
  browser_download_url: string;
  size: number;
  digest?: string;
};

export type GitHubRelease = {
  tag_name: string;
  name: string;
  published_at: string;
  html_url: string;
  body: string;
  assets: GitHubReleaseAsset[];
};

function getRepository() {
  const match = repositoryUrl.match(/^https:\/\/github\.com\/([^/]+)\/([^/]+)\/?$/i);
  if (!match) throw new Error("The configured GitHub repository URL is invalid.");
  return { owner: match[1], repo: match[2].replace(/\.git$/i, "") };
}

function isRepositoryUrl(value: string, owner: string, repo: string, section: "tag" | "download") {
  try {
    const url = new URL(value);
    const prefix = `/${owner}/${repo}/releases/${section === "tag" ? "tag" : "download"}/`.toLowerCase();
    return url.protocol === "https:" && url.hostname === "github.com" && url.pathname.toLowerCase().startsWith(prefix);
  } catch {
    return false;
  }
}

export async function fetchStableReleases(signal: AbortSignal): Promise<GitHubRelease[]> {
  const { owner, repo } = getRepository();
  const response = await fetch(`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/releases?per_page=100`, {
    headers: { Accept: "application/vnd.github+json" },
    signal,
  });
  if (!response.ok) throw new Error(`GitHub Releases returned HTTP ${response.status}.`);
  const payload: unknown = await response.json();
  if (!Array.isArray(payload)) throw new Error("GitHub returned an unexpected releases response.");

  return payload
    .filter((release): release is Record<string, unknown> => Boolean(release) && typeof release === "object" && !Array.isArray(release))
    .filter(release => release.draft === false && release.prerelease === false)
    .map(release => {
      if (typeof release.tag_name !== "string" || !release.tag_name || typeof release.published_at !== "string" || Number.isNaN(Date.parse(release.published_at)) || typeof release.html_url !== "string" || !isRepositoryUrl(release.html_url, owner, repo, "tag")) {
        throw new Error("A published release has incomplete or untrusted metadata.");
      }
      if (release.name != null && typeof release.name !== "string") throw new Error("GitHub returned an invalid release name.");
      if (release.body != null && typeof release.body !== "string") throw new Error("GitHub returned invalid release notes.");
      if (!Array.isArray(release.assets)) throw new Error("GitHub returned an invalid release asset list.");

      const assets = release.assets.flatMap((candidate): GitHubReleaseAsset[] => {
        if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) return [];
        const asset = candidate as Record<string, unknown>;
        if (typeof asset.name !== "string" || typeof asset.browser_download_url !== "string" || typeof asset.size !== "number" || !Number.isFinite(asset.size) || asset.size < 0 || !isRepositoryUrl(asset.browser_download_url, owner, repo, "download")) return [];
        const digest = typeof asset.digest === "string" && /^sha256:[a-f\d]{64}$/i.test(asset.digest) ? asset.digest.slice(7).toLowerCase() : undefined;
        return [{ name: asset.name, browser_download_url: asset.browser_download_url, size: asset.size, ...(digest ? { digest } : {}) }];
      });

      return {
        tag_name: release.tag_name,
        name: typeof release.name === "string" && release.name.trim() ? release.name : release.tag_name,
        published_at: release.published_at,
        html_url: release.html_url,
        body: typeof release.body === "string" ? release.body : "",
        assets,
      };
    })
    .sort((a, b) => Date.parse(b.published_at) - Date.parse(a.published_at));
}

export function displayVersion(tag: string) {
  const version = tag.replace(/^desktop-/i, "");
  return /^v/i.test(version) ? version : `v${version}`;
}
