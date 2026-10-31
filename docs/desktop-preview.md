# JARVIS desktop preview

JARVIS now has an independently buildable Tauri 2 shell with its own Vite entry point (`desktop-ui/`) and native Rust project (`src-tauri/`). The website remains the root Vite app and continues to build separately. The desktop entry opens a status dashboard and reuses the existing local Ollama chat.

## Current scope

The preview can check an Ollama server on the same computer and open the existing text-chat interface. It stores chat history in the desktop webview's local storage, which is not encrypted. Voice, native file access, computer control, automation, cloud providers, a native credential store, and SQLite persistence are not included. Treat preview builds as early software and do not use them with sensitive data.

The webview calls Ollama directly. Ollama must allow the exact desktop webview origin for the target operating system (commonly `http://tauri.localhost` on Windows and `tauri://localhost` on macOS/Linux). Add only the exact origin you trust to Ollama's `OLLAMA_ORIGINS`; do not use a wildcard or expose Ollama publicly. Check Ollama's own documentation for setting environment variables on your operating system.

## Build separation

The website uses the root Vite configuration and its normal build. The desktop frontend has a separate Vite configuration, output directory, and Tauri commands:

- `npm run desktop:dev` starts the desktop preview.
- `npm run desktop:build` builds the native app and selected installer bundles.
- Node.js 22+, Rust stable, and the platform's Tauri build prerequisites are required.

The desktop build generates application icons from the existing SVG favicon and bundles the independent desktop frontend. It does not alter the website's Vite output.

## Windows installer workflow

The GitHub Actions workflow at `.github/workflows/desktop-build.yml` runs only on a native `windows-latest` runner. A `desktop-vX.Y.Z` tag builds Windows x64 NSIS EXE and MSI packages. CI verifies that the tag matches `package.json`, `src-tauri/tauri.conf.json`, and `src-tauri/Cargo.toml`, then attaches successful builds to a **draft** GitHub release. The current workflow does not build macOS or Linux installers; those platforms remain unavailable until separately built and validated. Review and smoke-test the Windows package, complete the release notes, and publish the draft to make its actual assets visible on the website.

Before a release, update `package.json`, `src-tauri/tauri.conf.json`, and `src-tauri/Cargo.toml` to the same version (currently `0.1.0`), commit that change, and create a `desktop-vX.Y.Z` tag with the matching version. The workflow fails if either version differs. Wait for the Windows job to upload its assets, install and smoke-test the package on Windows x64, record the tested Windows version and architecture in the release notes, and publish the draft only after review. The `/download` page reads the public GitHub Releases API and updates itself after a stable release is published; it ignores drafts and prereleases. No binaries need to be committed to the website repository.

These packages are unsigned preview builds. Windows may show SmartScreen or unknown-publisher warnings because the app is not code-signed. Signing credentials are intentionally not stored in this repository. The website download center continues to show only actual assets from a published GitHub release; a draft release is not advertised as a download.

The Windows workflow is configured but has not been executed in this environment, and no Windows installer has been generated yet. macOS and Linux remain Coming soon. Do not describe Windows as validated until its native build and launch have been checked. See [the secure update plan](desktop-updates.md); automatic updates remain disabled until signing keys and a signed manifest are configured.
