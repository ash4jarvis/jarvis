# JARVIS desktop preview

JARVIS has an independently buildable Tauri 2 shell with its own Vite entry point (`desktop-ui/`) and native Rust project (`src-tauri/`). The website remains the root Vite app and continues to build separately. Desktop chat defaults to Gemini with optional Ollama; the dashboard checks the selected provider.

## Current scope

The desktop chat now defaults to the Gemini API and retains Ollama as an optional local provider. Gemini API keys are stored in the operating system credential store through the native Tauri layer; they are not returned to the frontend or saved in local storage. Selecting Gemini sends conversation messages to Google using the user's own API key. Cloud use may have separate usage limits or billing. This native provider path has passed frontend build and type checks but has not yet been compiled or runtime-tested on Windows. Ollama and its models are optional and must be installed separately; the installer does not download either one. Chat history and personalization preferences remain in webview local storage, which is not encrypted. Voice input/output are best-effort WebView features and depend on operating-system speech services and microphone permission. Native file access, computer control, automation, and SQLite persistence are not included. Treat preview builds as early software and do not use them with sensitive data.

The optional Ollama provider calls the local Ollama server from the webview. Ollama must allow the exact desktop webview origin for the target operating system (commonly `http://tauri.localhost` on Windows and `tauri://localhost` on macOS/Linux). Add only the exact origin you trust to Ollama's `OLLAMA_ORIGINS`; do not use a wildcard or expose Ollama publicly. On Windows, restart Ollama after changing this setting. A successful Ollama status check means the server is reachable; users must still select an installed model in chat. Check Ollama's own documentation for setting environment variables on your operating system.

## Gemini setup

Choose **Gemini** in chat and enter a Gemini API key from Google AI Studio in **Provider & preferences**. JARVIS stores the key in the OS credential store (Windows Credential Manager, macOS Keychain, or Linux Secret Service through the `keyring` crate) and uses a native HTTPS request to Google's Gemini API. Model names are retrieved from the API for that key. The key is never stored in browser local storage or embedded in the frontend bundle. Gemini API usage is governed by the user's Google AI Studio project, quota, and billing settings; a consumer Gemini subscription does not guarantee API access or free API use. These native commands are not considered validated until a Windows Rust/Tauri build and key-storage/API smoke test pass.

## Personalization and voice

The chat preferences currently let users set their name, assistant name, dark/light appearance, and voice input/output toggles. These are stored in local storage and are not synced. Speech recognition support varies by WebView; if unavailable, text chat remains usable. Voice input is push-to-talk and does not listen in the background. Speech output can be interrupted by browser/WebView controls; voice speed and voice selection are not yet configurable. In the desktop app, “play [show] on YouTube” opens a YouTube search in the system browser; the user chooses the video. This is a narrowly scoped browser action, not general computer control.

## Phone companion and REA

No phone companion, call answering, SMS control, or REA integration is included in this preview. A future companion must pair through an authenticated, encrypted link, show the connected device, and request only the permissions it uses. Sending or replying to a message should show the recipient and exact message for confirmation; automatic replies should be off by default and restricted to explicit user-created rules. Android phone/SMS handling requires a separate native app and, for many call/SMS features, user selection of JARVIS as the default handler ([Android default dialer](https://developer.android.com/develop/connectivity/telecom/dialer-app), [restricted call/SMS permissions](https://developer.android.com/guide/topics/permissions/default-handlers)). iOS cannot grant general access to ordinary Phone and Messages activity; CallKit is for integrating JARVIS's own VoIP service with system calling UI ([Apple CallKit guide](https://developer.apple.com/documentation/callkit/making-and-receiving-voip-calls)).

REA remains an optional, separately installed analysis tool; the desktop app does not bundle it or accept arbitrary targets to execute. A safe REA workflow should prefer passive/static inspection, require the user to select the exact website or application, and clearly label any active runtime instrumentation before it begins.

## Build separation

The website uses the root Vite configuration and its normal build. The desktop frontend has a separate Vite configuration, output directory, and Tauri commands:

- `npm run desktop:dev` starts the desktop preview.
- `npm run desktop:build` builds the native app and selected installer bundles.
- Node.js 22+, Rust stable, and the platform's Tauri build prerequisites are required.

The desktop build generates application icons from the existing SVG favicon and bundles the independent desktop frontend. It does not alter the website's Vite output.

## Cross-platform installer workflow

The GitHub Actions workflow at `.github/workflows/desktop-build.yml` builds on native runners: Windows x64 EXE/MSI, macOS Apple Silicon and Intel DMGs, and Linux x64 AppImage/DEB. Linux uses Ubuntu 22.04 as the build baseline to reduce compatibility problems on older distributions. The workflow checks release-tag version matches across `package.json`, `src-tauri/tauri.conf.json`, and `src-tauri/Cargo.toml`, and attaches build outputs to a **draft** GitHub release only after every platform job succeeds. Review the release notes and smoke-test packages on their target operating systems before publishing. The `/download` page reads the public GitHub Releases API, displays actual assets from published releases, and excludes drafts. No binaries need to be committed to the website repository.

The current app version is `0.1.1`. For a later release, update `package.json`, `src-tauri/tauri.conf.json`, and `src-tauri/Cargo.toml` to the same version, commit the change, and create a matching `desktop-vX.Y.Z` tag. The workflow fails if the tag and app versions differ.

These are unsigned preview builds. Windows may show SmartScreen or unknown-publisher warnings; macOS may block an unnotarized app until the user explicitly allows it in Privacy & Security. Signing credentials are intentionally not stored in this repository. Linux users need compatible WebKitGTK system libraries for the DEB; AppImage may still depend on baseline system libraries and distribution compatibility. The website shows only actual assets from a published release; a draft is not advertised as a download.

The new Mac and Linux CI jobs have not yet run, and no cross-platform package is being described as compatible until native build and launch checks pass on each target. See [the secure update plan](desktop-updates.md); automatic updates remain disabled until signing keys and a signed manifest are configured.
