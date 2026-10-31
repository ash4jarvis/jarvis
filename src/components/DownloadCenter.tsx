import { CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowDownToLine, ArrowUpRight, BadgeCheck, CalendarDays, Check, ChevronDown, CircleAlert, Download, ExternalLink, HardDrive, Laptop, Monitor, RefreshCw, ShieldAlert, Terminal } from "lucide-react";
import { GitHubRelease, GitHubReleaseAsset, displayVersion, fetchPublishedReleases } from "@/lib/githubReleases";
import { releasesUrl } from "@/lib/siteConfig";
import "./DownloadCenter.css";

type Platform = "windows" | "macos" | "linux" | "other" | "detecting";
type Architecture = "x64" | "arm64" | "unknown";
type Device = { platform: Platform; architecture: Architecture };
type Slot = {
  id: string;
  platform: Exclude<Platform, "other" | "detecting">;
  architecture: Exclude<Architecture, "unknown">;
  title: string;
  detail: string;
  fileLabel: string;
  extension: string;
  match: (name: string) => boolean;
};

type UserAgentData = {
  platform?: string;
  architecture?: string;
  bitness?: string;
  getHighEntropyValues?: (hints: string[]) => Promise<{ architecture?: string; bitness?: string }>;
};

const slots: Slot[] = [
  { id: "windows-x64-exe", platform: "windows", architecture: "x64", title: "Windows 10 / 11", detail: "64-bit · x64", fileLabel: "EXE installer", extension: ".exe", match: name => /\.exe$/i.test(name) && /(?:x64|x86_64|amd64)/i.test(name) },
  { id: "windows-x64-msi", platform: "windows", architecture: "x64", title: "Windows 10 / 11", detail: "64-bit · x64", fileLabel: "MSI installer", extension: ".msi", match: name => /\.msi$/i.test(name) && /(?:x64|x86_64|amd64)/i.test(name) },
  { id: "macos-arm64", platform: "macos", architecture: "arm64", title: "macOS · Apple Silicon", detail: "ARM64 · M-series", fileLabel: "DMG installer", extension: ".dmg", match: name => /\.dmg$/i.test(name) && /(?:arm64|aarch64|apple[-_ ]?silicon|universal)/i.test(name) },
  { id: "macos-x64", platform: "macos", architecture: "x64", title: "macOS · Intel", detail: "Intel · x64", fileLabel: "DMG installer", extension: ".dmg", match: name => /\.dmg$/i.test(name) && /(?:x64|x86_64|intel|universal)/i.test(name) },
  { id: "linux-x64-appimage", platform: "linux", architecture: "x64", title: "Linux · AppImage", detail: "64-bit · x86_64", fileLabel: "AppImage", extension: ".AppImage", match: name => /\.appimage$/i.test(name) && /(?:amd64|x86_64|x64)/i.test(name) },
  { id: "linux-x64-deb", platform: "linux", architecture: "x64", title: "Linux · Debian package", detail: "64-bit · x86_64", fileLabel: "DEB installer", extension: ".deb", match: name => /\.deb$/i.test(name) && /(?:amd64|x86_64|x64)/i.test(name) },
];

const platformLabel: Record<Platform, string> = { windows: "Windows", macos: "macOS", linux: "Linux", other: "Other platform", detecting: "Detecting…" };
const formatBytes = (size: number) => size >= 1_000_000_000 ? `${(size / 1_000_000_000).toFixed(1)} GB` : `${(size / 1_000_000).toFixed(1)} MB`;
const formatDate = (value: string) => new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(value));
const normalizeArchitecture = (architecture?: string, bitness?: string): Architecture => {
  const value = architecture?.toLowerCase() || "";
  if (["arm64", "aarch64"].includes(value) || (value === "arm" && bitness === "64")) return "arm64";
  if (["x64", "x86_64", "amd64"].includes(value) || (value === "x86" && bitness === "64")) return "x64";
  return "unknown";
};

function detectDevice(): Promise<Device> {
  return (async () => {
    const ua = navigator.userAgent.toLowerCase();
    const data = (navigator as Navigator & { userAgentData?: UserAgentData }).userAgentData;
    const platformValue = (data?.platform || navigator.platform || navigator.userAgent).toLowerCase();
    const mobileApple = /iphone|ipad|ipod/.test(ua);
    const platform: Platform = mobileApple ? "other" : /windows|win32|win64/.test(platformValue) ? "windows" : /mac/.test(platformValue) ? "macos" : /linux|x11/.test(platformValue) ? "linux" : "other";
    let architecture = normalizeArchitecture(data?.architecture, data?.bitness);
    if (data?.getHighEntropyValues) {
      try {
        const details = await data.getHighEntropyValues(["architecture", "bitness"]);
        architecture = normalizeArchitecture(details.architecture || data.architecture, details.bitness || data.bitness);
      } catch { }
    }
    if (architecture === "unknown" && platform !== "macos") {
      if (/(?:x86_64|x64|amd64|win64)/.test(ua)) architecture = "x64";
      else if (/(?:aarch64|arm64|armv8)/.test(ua)) architecture = "arm64";
    }
    return { platform, architecture };
  })();
}

function platformIcon(platform: Slot["platform"]) {
  return platform === "windows" ? Monitor : platform === "macos" ? Laptop : Terminal;
}

function assetFor(release: Pick<GitHubRelease, "assets"> | null, slot: Slot): GitHubReleaseAsset | undefined {
  return release?.assets.find(asset => slot.match(asset.name));
}

function recommendedSlot(device: Device, assets: GitHubReleaseAsset[]) {
  const release = { assets };
  if (device.platform === "windows" && device.architecture === "x64") {
    return slots.find(slot => slot.id === "windows-x64-exe" && assetFor(release, slot))
      || slots.find(slot => slot.id === "windows-x64-msi" && assetFor(release, slot));
  }
  if (device.platform === "macos" && device.architecture !== "unknown") {
    return slots.find(slot => slot.platform === "macos" && slot.architecture === device.architecture && assetFor(release, slot));
  }
  if (device.platform === "linux" && device.architecture === "x64") {
    return slots.find(slot => slot.id === "linux-x64-appimage" && assetFor(release, slot))
      || slots.find(slot => slot.id === "linux-x64-deb" && assetFor(release, slot));
  }
  return undefined;
}

export default function DownloadCenter() {
  const [releases, setReleases] = useState<GitHubRelease[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "none" | "error">("loading");
  const [error, setError] = useState("");
  const [device, setDevice] = useState<Device>({ platform: "detecting", architecture: "unknown" });
  const controllerRef = useRef<AbortController | null>(null);

  const loadReleases = useCallback(async () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setState("loading");
    setError("");
    try {
      const published = await fetchPublishedReleases(controller.signal);
      if (controller.signal.aborted) return;
      setReleases(published);
      setState(published.length ? "ready" : "none");
    } catch (reason) {
      if (controller.signal.aborted) return;
      setError(reason instanceof Error ? reason.message : "The public GitHub release feed could not be read.");
      setState("error");
    }
  }, []);

  useEffect(() => {
    void detectDevice().then(setDevice);
    void loadReleases();
    return () => controllerRef.current?.abort();
  }, [loadReleases]);

  const latest = releases[0] || null;
  const previous = releases.filter(release => !release.prerelease).slice(0, 5);
  const recommendation = useMemo(() => latest ? recommendedSlot(device, latest.assets) : undefined, [device, latest]);
  const recommendedAsset = latest && recommendation ? assetFor(latest, recommendation) : undefined;
  const deviceDescription = device.architecture === "unknown" ? `${platformLabel[device.platform]} · architecture not confirmed` : `${platformLabel[device.platform]} · ${device.architecture}`;

  return <main className="page-main download-page">
    <header className="page-hero download-hero"><div className="section-kicker">JARVIS DESKTOP · OFFICIAL RELEASES</div><h1>One download.<br/><span>Your own orbit.</span></h1><p>Find the package that matches your operating system and processor. Links appear only for installer files attached to a published GitHub release; previews are labeled.</p><div className="detected"><span className="live-dot"/> YOUR DEVICE <b>{deviceDescription}</b></div></header>

    {state === "loading" && <section className="download-release-loading" aria-label="Loading JARVIS releases" aria-busy="true"><span className="download-spinner"/><div><b>Checking official releases</b><p>Verifying published JARVIS versions and installer files…</p></div></section>}
    {state === "error" && <div className="download-warning download-error" role="alert"><CircleAlert size={17}/><div><b>Could not verify GitHub Releases.</b><p>{error} No direct download links are shown until the feed can be checked.</p><button className="release-retry" onClick={() => void loadReleases()}><RefreshCw size={14}/> Try again</button><a href={releasesUrl} target="_blank" rel="noreferrer">Open official Releases <ArrowUpRight size={13}/></a></div></div>}
    {state === "none" && <div className="download-empty" role="status"><ShieldAlert size={20}/><div><b>No published installer release yet</b><p>JARVIS will show downloads here after a GitHub release with installer files is published. Draft releases are not shown.</p><a href={releasesUrl} target="_blank" rel="noreferrer">View GitHub Releases <ArrowUpRight size={14}/></a></div></div>}

    {state === "ready" && latest && <>
      <section className="download-release-summary" aria-label={latest.prerelease ? "Latest preview release" : "Latest stable release"}>
        <div className="release-summary-icon"><Download size={20}/></div>
        <div className="release-summary-main"><div className="section-kicker">{latest.prerelease ? "LATEST PREVIEW RELEASE" : "LATEST STABLE RELEASE"}</div><h2>{displayVersion(latest.tag_name)}</h2><p>{latest.name}</p></div>
        <div className="release-summary-date"><CalendarDays size={15}/><span>Published <b>{formatDate(latest.published_at)}</b></span></div>
        <a className="release-notes-link" href={latest.html_url} target="_blank" rel="noreferrer">Full release <ExternalLink size={14}/></a>
      </section>

      <div className="download-recommendation" aria-live="polite">
        <div className="recommendation-label"><BadgeCheck size={15}/> {recommendation && recommendedAsset ? "RECOMMENDED DOWNLOAD" : "MATCH YOUR DEVICE"}</div>
        {recommendation && recommendedAsset ? <div className="recommendation-content"><div><b>{recommendation.title} · {recommendation.architecture}</b><span>{recommendation.fileLabel} · {formatBytes(recommendedAsset.size)}</span><small>Architecture match only; check the release notes for platform testing details.</small></div><a className="download-primary" href={recommendedAsset.browser_download_url} target="_blank" rel="noreferrer"><ArrowDownToLine size={16}/> Download {recommendation.extension}</a></div> : <p>{device.platform === "detecting" ? "Detecting your device before recommending a package." : device.architecture === "unknown" && device.platform === "macos" ? "Choose Apple Silicon or Intel below; this browser does not reliably expose your Mac's processor." : device.platform !== "other" && device.architecture !== "unknown" ? `No published ${deviceDescription} installer was found in this release.` : "Choose a package below. The release lists its operating system and architecture."}</p>}
      </div>

      <div className="download-section-heading"><div><div className="section-kicker">MATCHED TO THE RELEASE ASSETS</div><h2>Choose your installer.</h2></div><span>{latest.assets.length} release asset{latest.assets.length === 1 ? "" : "s"} · {displayVersion(latest.tag_name)}</span></div>
      <div className="download-grid download-grid-four release-asset-grid">{slots.map((slot, index) => {
        const asset = assetFor(latest, slot);
        const Icon = platformIcon(slot.platform);
        const recommended = recommendation?.id === slot.id;
        return <article className={`download-card release-asset-card ${asset ? "asset-present" : "asset-unavailable"} ${recommended ? "asset-recommended" : ""}`} key={slot.id} style={{ "--card-delay": `${index * 65}ms` } as CSSProperties}>
          <div className="download-card-head"><div className="download-platform-mark"><Icon size={19}/></div><span className="download-arch-pill">{slot.detail}</span></div>
          <h3>{slot.title}</h3><p className="download-file-kind">{slot.fileLabel} <span>({slot.extension})</span></p>
          {asset ? <><a className="asset-download release-asset-button" href={asset.browser_download_url} target="_blank" rel="noreferrer" aria-label={`Download ${slot.title} ${slot.detail} ${slot.fileLabel}`}><ArrowDownToLine size={15}/> Download package</a><div className="asset-metadata"><span><HardDrive size={12}/>{formatBytes(asset.size)}</span>{asset.digest ? <code title="SHA-256 digest">SHA-256 · {asset.digest.slice(0, 12)}…</code> : <span className="digest-missing">No SHA-256 digest</span>}</div><p className="asset-validation-note">Published asset · test status is not supplied by GitHub metadata.</p></> : <div className="asset-unavailable-note">Coming soon · no matching {slot.architecture} installer in this release.</div>}
          {recommended && asset && <span className="recommended-chip"><Check size={11}/> Best match</span>}
        </article>;
      })}</div>

      {latest.body && <details className="release-notes-panel"><summary><span><div className="section-kicker">WHAT'S NEW</div><b>Release notes · {displayVersion(latest.tag_name)}</b></span><ChevronDown size={17}/></summary><pre>{latest.body}</pre></details>}
      <section className="previous-releases"><div><div className="section-kicker">RELEASE HISTORY</div><h2>Earlier stable versions.</h2><p>Preview versions and drafts are excluded from stable history. Every link opens the official GitHub release.</p></div>{previous.length ? <ul className="previous-release-list">{previous.map(release => <li key={release.tag_name}><div><b>{displayVersion(release.tag_name)}</b><span>{formatDate(release.published_at)}</span></div><a href={release.html_url} target="_blank" rel="noreferrer" aria-label={`Release notes for ${displayVersion(release.tag_name)}`}>Release notes <ArrowUpRight size={14}/></a></li>)}</ul> : <p className="previous-empty">No earlier stable releases are available.</p>}</section>
    </>}

    {(state === "loading" || state === "none" || state === "error") && <section className="unreleased-packages"><div className="download-section-heading"><div><div className="section-kicker">{state === "error" ? "RELEASE FEED UNAVAILABLE · DOWNLOADS DISABLED" : state === "loading" ? "CHECKING OFFICIAL RELEASE FEED" : "WINDOWS X64 RELEASE PENDING · MACOS/LINUX COMING SOON"}</div><h2>Installer availability.</h2></div></div><div className="download-grid download-grid-four unreleased-package-grid">{slots.map(slot => { const Icon = platformIcon(slot.platform); const statusLabel = state === "loading" ? "Checking release…" : state === "error" ? "Unable to verify" : "Coming soon"; return <article className="download-card unreleased-package-card" key={slot.id}><div className="download-card-head"><div className="download-platform-mark"><Icon size={18}/></div><span className="download-arch-pill">{slot.detail}</span></div><h3>{slot.title}</h3><p className="download-file-kind">{slot.fileLabel} <span>({slot.extension})</span></p><span className="unreleased-status">{statusLabel}</span></article>; })}</div><p className="unreleased-note">No download buttons appear until a real installer is attached to a published GitHub release.</p></section>}

      <section className="system-requirements"><div className="download-section-heading"><div><div className="section-kicker">BEFORE YOU INSTALL</div><h2>System requirements.</h2></div></div><div className="requirements-grid"><article><Monitor size={18}/><h3>Windows</h3><p>64-bit x64 package. Requires a supported Windows version and Microsoft Edge WebView2 Runtime. Check this release's notes for tested Windows versions.</p></article><article><Laptop size={18}/><h3>macOS</h3><p>Choose the DMG matching Apple Silicon (ARM64) or Intel (x64). Check the release notes for the minimum macOS version tested.</p></article><article><Terminal size={18}/><h3>Linux</h3><p>64-bit x86_64 packages. Desktop WebKitGTK runtime and distribution compatibility may vary; use the release notes for tested distributions.</p></article></div><p className="requirements-caveat"><ShieldAlert size={14}/> An available file means the asset was published; it is not a certification of platform support. JARVIS's current chat needs Ollama running locally; Ollama is not bundled with the installer.</p></section>

      <section className="installation-guides"><div className="download-section-heading"><div><div className="section-kicker">INSTALLATION GUIDES</div><h2>Install with care.</h2></div></div>
        <details className="install-guide"><summary><span><Monitor size={16}/> Windows · EXE or MSI</span><ChevronDown size={16}/></summary><div className="install-guide-content"><ol><li>Choose a Windows x64 EXE or MSI from a published GitHub release; no package is downloaded from this guide.</li><li>Open the downloaded file and review the installer name and publisher prompt before continuing.</li><li>Follow the setup steps. Close JARVIS when the installer finishes, then launch it from the Start menu.</li><li>To use local chat, install and start Ollama separately, then allow only the exact JARVIS WebView origin in Ollama.</li></ol><p className="security-callout"><ShieldAlert size={15}/> Preview packages are not code-signed. Windows may show SmartScreen or an unknown-publisher warning. Do not bypass a warning unless you have independently verified the official release and file integrity.</p></div></details>
        <details className="install-guide"><summary><span><Laptop size={16}/> macOS · Apple Silicon or Intel</span><ChevronDown size={16}/></summary><div className="install-guide-content"><ol><li>Choose a published DMG for your Mac's processor: Apple Silicon (ARM64) or Intel (x64). If your browser cannot identify the chip, confirm it in Apple menu → About This Mac.</li><li>Open the downloaded DMG. Move JARVIS to Applications if the installer presents that option, then eject the mounted disk image.</li><li>Launch JARVIS from Applications. Check the release notes for the macOS versions tested with this build.</li><li>For local chat, install and start Ollama separately and allow only the exact JARVIS WebView origin.</li></ol><p className="security-callout"><ShieldAlert size={15}/> Preview packages are not code-signed or notarized. macOS Gatekeeper may block them. Do not disable Gatekeeper or bypass its warning unless you have independently reviewed the source and verified the release.</p></div></details>
        <details className="install-guide"><summary><span><Terminal size={16}/> Linux · AppImage or DEB</span><ChevronDown size={16}/></summary><div className="install-guide-content"><ol><li>Choose a published x86_64 AppImage or Debian package that matches your distribution.</li><li>For AppImage, use your file manager's Properties → Permissions to allow execution, then open the file. For DEB, open it with your distribution's software installer and follow its prompts.</li><li>Check the release notes for tested distributions and any WebKitGTK dependencies before launching.</li><li>Install and start Ollama separately if you want to use local chat.</li></ol><p className="security-callout"><ShieldAlert size={15}/> Download only from the linked official GitHub release. Review the SHA-256 digest when GitHub provides one; this release feed does not provide a digest for every file.</p></div></details>
      </section>

    {state === "ready" && !latest && <div className="download-empty" role="status"><ShieldAlert size={20}/><div><b>No published installer release yet</b><p>No published release with valid public metadata was found. Drafts are never shown as downloads.</p><a href={releasesUrl} target="_blank" rel="noreferrer">View GitHub Releases <ArrowUpRight size={14}/></a></div></div>}
  </main>;
}

