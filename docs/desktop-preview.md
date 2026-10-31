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

## Cross-platform installer workflow

The GitHub Actions workflow at `.github/workflows/desktop-build.yml` runs on native Windows, macOS Apple Silicon, macOS Intel, and Linux runners. A `desktop-v*` tag builds Windows NSIS EXE and MSI packages, architecture-specific macOS DMGs, and Linux AppImage and DEB packages. The workflow attaches successful builds to a **draft** GitHub release. Review the builds and release notes before publishing the draft.

These packages are unsigned preview builds. Windows may show SmartScreen warnings, and macOS may block first launch because the app is not signed and notarized. Signing credentials are intentionally not stored in this repository. The website download center continues to show only actual assets from a published GitHub release; a draft release is not advertised as a download.

Cross-platform builds are configured but have not been built or smoke-tested on every target in this environment. Do not describe a platform as validated until its native build and launch have been checked.
