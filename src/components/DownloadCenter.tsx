import { useEffect, useState } from "react";
import { ArrowUpRight, Download, RefreshCw } from "lucide-react";
import { releasesUrl, repositoryUrl } from "@/lib/siteConfig";

type ReleaseAsset = { name: string; browser_download_url: string; size: number; digest?: string | null };
type Release = { tag_name: string; published_at: string; html_url: string; assets: ReleaseAsset[] };
type AssetSlot = { id: string; platform: string; detail: string; fileLabel: string; match: (name: string) => boolean };
const slots: AssetSlot[] = [
  { id: "windows-exe", platform: "Windows", detail: "Windows 10 / 11", fileLabel: "EXE installer", match: name => /\.exe$/i.test(name) },
  { id: "windows-msi", platform: "Windows", detail: "Windows 10 / 11", fileLabel: "MSI installer", match: name => /\.msi$/i.test(name) },
  { id: "mac-arm", platform: "macOS · Apple Silicon", detail: "Apple Silicon · ARM64", fileLabel: "DMG package", match: name => /\.dmg$/i.test(name) && /(arm64|aarch64|apple[-_ ]?silicon|universal)/i.test(name) },
  { id: "mac-intel", platform: "macOS · Intel", detail: "Intel · x64", fileLabel: "DMG package", match: name => /\.dmg$/i.test(name) && /(x64|x86_64|intel|universal)/i.test(name) },
  { id: "linux-appimage", platform: "Linux", detail: "Linux · AppImage", fileLabel: "AppImage", match: name => /\.appimage$/i.test(name) },
  { id: "linux-deb", platform: "Linux", detail: "Linux · Debian package", fileLabel: "DEB package", match: name => /\.deb$/i.test(name) },
];
const formatBytes = (size: number) => size >= 1_000_000_000 ? `${(size / 1_000_000_000).toFixed(1)} GB` : `${(size / 1_000_000).toFixed(1)} MB`;
const formatDate = (value: string) => new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(value));
const getDigest = (asset: ReleaseAsset) => asset.digest?.match(/^sha256:([a-f\d]{64})$/i)?.[1] || "";

export default function DownloadCenter() {
  const [release, setRelease] = useState<Release | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "none" | "error">("loading");
  const [platform, setPlatform] = useState("Your platform");
  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    setPlatform(ua.includes("win") ? "Windows" : ua.includes("mac") ? "macOS (choose your processor)" : ua.includes("linux") ? "Linux" : "Your platform");
  }, []);
  useEffect(() => {
    const match = repositoryUrl.match(/^https:\/\/github\.com\/([^/]+)\/([^/]+)/i);
    if (!match) { setState("error"); return; }
    const owner = match[1]; const repository = match[2].replace(/\.git$/i, "");
    const controller = new AbortController();
    fetch(`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/releases/latest`, {
      headers: { Accept: "application/vnd.github+json" }, signal: controller.signal,
    }).then(async response => {
      if (response.status === 404) { setState("none"); return; }
      if (!response.ok) throw new Error(`GitHub release lookup returned ${response.status}`);
      const data = await response.json() as Release;
      if (!data || typeof data.tag_name !== "string" || typeof data.published_at !== "string" || Number.isNaN(Date.parse(data.published_at)) || typeof data.html_url !== "string" || !Array.isArray(data.assets) || data.assets.some(asset => !asset || typeof asset.name !== "string" || typeof asset.browser_download_url !== "string" || typeof asset.size !== "number")) throw new Error("GitHub returned an unexpected release response.");
      const releasePage = new URL(data.html_url);
      if (releasePage.protocol !== "https:" || releasePage.hostname !== "github.com") throw new Error("GitHub returned an unexpected release URL.");
      setRelease(data); setState("ready");
    }).catch(error => { if (error.name !== "AbortError") setState("error"); });
    return () => controller.abort();
  }, []);
  const userAssets = release?.assets || [];
  const releasePresent = state === "ready" && release;
  const assetFor = (slot: AssetSlot) => {
    const candidate = userAssets.find(asset => slot.match(asset.name));
    if (!candidate) return undefined;
    try { const url = new URL(candidate.browser_download_url); return url.protocol === "https:" && url.hostname === "github.com" ? candidate : undefined; } catch { return undefined; }
  };
  const displayStatus = state === "loading" ? "Checking official release assets…" : state === "none" ? "No published release" : state === "error" ? "Could not verify release assets" : "Latest published release";
  return <main className="page-main download-page">
    <div className="page-hero"><div className="section-kicker">DOWNLOAD JARVIS</div><h1>Ready when<br/><span>you are.</span></h1><p>Downloads appear only when a matching installer is published in the official GitHub release.</p><div className="detected"><span className="live-dot"/> DETECTED PLATFORM <b>{platform}</b></div></div>
    <div className="release-bar"><span><span className="status-hollow"/> {displayStatus}</span>{releasePresent ? <><span>Version · {release.tag_name}</span><span>Released · {formatDate(release.published_at)}</span><a href={release.html_url} target="_blank" rel="noreferrer">Release notes <ArrowUpRight size={14}/></a></> : <><span>Version · —</span><span>Release date · —</span><a href={releasesUrl} target="_blank" rel="noreferrer">View GitHub Releases <ArrowUpRight size={14}/></a></>}</div>
    {state === "error" && <div className="download-warning" role="status"><RefreshCw size={15}/> The release feed could not be verified. No direct download links are shown. Check the official release page instead.</div>}
    {state === "none" && <div className="download-warning" role="status">There is no published GitHub release yet. Packages will remain marked Coming soon until actual release assets exist.</div>}
    <div className="download-grid download-grid-four">{slots.map(slot => {
      const asset = releasePresent ? assetFor(slot) : undefined;
      const digest = asset ? getDigest(asset) : "";
      return <article className="download-card" key={slot.id}><div className="download-card-head"><div><div className="section-kicker">{slot.detail}</div><h2>{slot.platform}</h2></div><Download size={20}/></div><div className="package-row"><span>{slot.fileLabel}</span>{asset ? <a className="asset-download" href={asset.browser_download_url} target="_blank" rel="noreferrer" download>Download <ArrowUpRight size={13}/></a> : <b>Coming soon</b>}</div>{asset ? <div className="asset-metadata"><span>{formatBytes(asset.size)}</span>{digest ? <code title="SHA-256 digest">SHA-256: {digest}</code> : <span>SHA-256 not provided</span>}</div> : <div className="package-note">No matching published asset was found in the latest release.</div>}</article>;
    })}</div>
    <div className="install-info"><div><div className="section-kicker">INSTALLATION STATUS</div><h2>Instructions that match<br/>real packages.</h2></div><div><p><b>Windows 10 / 11:</b> No verified Windows installer is published yet. Installation instructions will be added when an EXE or MSI release is available.</p><p><b>macOS Apple Silicon and Intel:</b> No architecture-matched DMG is published yet. Choose the package matching your Mac's processor when a release becomes available.</p><p><b>Linux:</b> No AppImage or DEB package is published yet. Distribution requirements and installation steps will accompany a tested release.</p><a className="text-link" href={releasesUrl} target="_blank" rel="noreferrer">Browse official releases <ArrowUpRight size={15}/></a></div></div>
    <div className="previous-releases"><div><div className="section-kicker">RELEASE HISTORY</div><h2>Verified releases only.</h2><p>Open GitHub Releases for published versions and their complete asset list.</p></div><a className="button secondary" href={releasesUrl} target="_blank" rel="noreferrer">All releases <ArrowUpRight size={14}/></a></div>
  </main>;
}
