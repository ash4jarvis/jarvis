# JARVIS

**Your AI. Your Device. Your Rules.**

JARVIS is intended to be a free, open-source, local-first personal AI assistant. The current repository contains the JARVIS website (Vite, React, TypeScript); the desktop assistant has not yet been implemented. Do not treat roadmap items as available product features.

## Current status

- Responsive marketing and documentation website with Home, Features, Download, Docs, FAQ, Privacy, and Open Source pages.
- Experimental browser chat at `/chat` can connect to Ollama on the same device, stream text responses, and keep conversations in browser local storage. See [local chat setup and security](docs/local-model-chat.md).
- Desktop downloads are not published. All packages remain Coming soon until official release artifacts exist.
- No packaged desktop app, voice, system control, cloud provider, SQLite persistence, or native platform adapter is currently included.

See [feature inventory](docs/FEATURE-INVENTORY.md) and [implementation roadmap](docs/ROADMAP.md) for verified scope and planned phases.

## Website development

The website is the Vite project at the repository root. Configure optional public GitHub links using `VITE_GITHUB_REPO` and `VITE_GITHUB_RELEASES_URL`. These values are public URLs, not secrets. Never put API credentials in `VITE_` variables.

The site can be built independently of the future desktop application. No official desktop download should be linked until verified release assets are published.

## License

Original JARVIS code is intended to be licensed under MIT. Third-party dependencies, models, voice assets, datasets, and generated assets have separate terms that must be reviewed independently before redistribution.
