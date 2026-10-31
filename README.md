# JARVIS

**Your AI. Your Device. Your Rules.**

JARVIS is an open-source project exploring a local-first personal AI assistant. The repository contains an independently deployable website and an early, independently buildable Tauri desktop shell. The preview is deliberately limited; roadmap items are not available features.

## Current status

- Responsive website with Home, Features, Download, Docs, FAQ, Privacy, and Open Source pages.
- Experimental browser chat at `/chat` and Developer Mode at `/developer` connect directly to Ollama on the same device. See [local chat setup](docs/local-model-chat.md) and [Developer Mode limits](docs/developer-mode.md).
- Early Tauri desktop preview with a local Ollama status check and the existing text chat. The chat history is stored in webview local storage, not encrypted. Voice, file access, system control, automation, cloud providers, SQLite persistence, and a native credential store are not included.
- Download Center checks the official GitHub Releases feed and links only matching assets in a published release. Missing packages never get fake links. The page fetches stable release notes and history and recommends only architecture-matched assets.
- GitHub Actions is configured to build unsigned Windows, macOS (Apple Silicon and Intel), and Linux installer previews on native runners. Successful packages are staged in a draft release for review; no installer is claimed as published until one is manually approved and released.

See the [desktop preview guide](docs/desktop-preview.md), [secure update plan](docs/desktop-updates.md), [feature inventory](docs/FEATURE-INVENTORY.md), and [implementation roadmap](docs/ROADMAP.md) for limitations and status.

## Website and desktop builds

The website remains the root Vite application and builds independently of the desktop frontend. Public GitHub links are configured with `VITE_GITHUB_REPO` and `VITE_GITHUB_RELEASES_URL`; these are public URLs, not secrets. Never put API credentials in `VITE_` variables.

The desktop frontend has its own Vite entry/output and Tauri configuration. Local preview/build scripts are `npm run desktop:dev` and `npm run desktop:build`; Node.js 22+, Rust stable, and platform build prerequisites are required. See [desktop preview](docs/desktop-preview.md) before building or installing.

## License

Original JARVIS code is intended to be licensed under MIT. Third-party dependencies, models, voice assets, datasets, and generated assets have separate terms that must be reviewed independently before redistribution.
