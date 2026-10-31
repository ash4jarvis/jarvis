# JARVIS

**Your AI. Your Device. Your Rules.**

JARVIS is an open-source project exploring a local-first personal AI assistant. The repository contains an independently deployable website and an early, independently buildable Tauri desktop shell. The preview is deliberately limited; roadmap items are not available features.

## Current status

- Responsive website with Home, Features, Download, Docs, FAQ, Privacy, and Open Source pages.
- Experimental browser chat at `/chat` and Developer Mode at `/developer` connect directly to Ollama on the same device. See [local chat setup](docs/local-model-chat.md) and [Developer Mode limits](docs/developer-mode.md).
- Early Tauri desktop preview with Gemini as the default cloud provider, optional local Ollama, model selection, customizable assistant/user names, dark/light appearance, and best-effort voice input/output. Gemini API keys are stored through the operating system credential store; prompts are sent to Google only when Gemini is selected. Ollama and local models remain optional and are installed separately. Conversations and preferences are stored in webview local storage, not encrypted. File access, system control, automation, SQLite persistence, and phone/REA integrations are not included. The native provider integration still requires a successful Windows build and runtime validation before it can be distributed as an installer.
- Download Center checks the official GitHub Releases feed and links only matching assets in a published release, including clearly labeled previews. Missing packages never get fake links. The page recommends only architecture-matched assets and keeps preview builds out of stable release history.
- GitHub Actions builds unsigned Windows x64 EXE/MSI, macOS Apple Silicon/Intel DMG, and Linux x64 AppImage/DEB preview installers. These platform jobs are configured but have not run yet; availability appears on the Download page only after the installers build successfully and are published. macOS packages are not notarized, and Linux runtime compatibility depends on the distribution's WebKitGTK version.

See the [desktop preview guide](docs/desktop-preview.md), [secure update plan](docs/desktop-updates.md), [feature inventory](docs/FEATURE-INVENTORY.md), and [implementation roadmap](docs/ROADMAP.md) for limitations and status.

## Website and desktop builds

The website remains the root Vite application and builds independently of the desktop frontend. Public GitHub links are configured with `VITE_GITHUB_REPO` and `VITE_GITHUB_RELEASES_URL`; these are public URLs, not secrets. Never put API credentials in `VITE_` variables.

The desktop frontend has its own Vite entry/output and Tauri configuration. Local preview/build scripts are `npm run desktop:dev` and `npm run desktop:build`; Node.js 22+, Rust stable, and platform build prerequisites are required. See [desktop preview](docs/desktop-preview.md) before building or installing.

## License

Original JARVIS code is intended to be licensed under MIT. Third-party dependencies, models, voice assets, datasets, and generated assets have separate terms that must be reviewed independently before redistribution.
