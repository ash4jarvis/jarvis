# JARVIS feature inventory

Inventory date: 2025-02-21

This inventory reflects the repository inspected for the expansion roadmap. “Implemented” means present in the current source, not simply described as a product goal.

## Repository and architecture

- **Implemented:** Vite + React 19 + TypeScript client-side application; React Router routes live in `src/App.tsx`; Tailwind and shadcn/Radix UI dependencies are available.
- **Implemented:** Website code is in `src/`, static assets in `public/`, deployment configuration includes Vercel routing.
- **Implemented:** A Tauri 2 / Rust desktop preview shell with a separate Vite frontend entry and a Windows x64 NSIS/MSI installer workflow.
- **Not present:** SQLite, API/server layer, provider framework, automated test suite, or native platform adapters.
- **Deployment note:** The website remains the root Vite app. Desktop UI uses `desktop-ui/`, `vite.desktop.config.ts`, and `src-tauri/`; it has independent web and native build scripts. Windows installer builds have not yet been run; macOS and Linux installers are not configured for the current release workflow.

## Website

- **Implemented:** Responsive dark-themed homepage, animated CSS orb, feature overview, download status page, documentation topic selector, FAQ accordion, privacy page, open-source page, mobile navigation, reduced-motion stylesheet, title/description updates, Open Graph metadata, favicon, robots file, and sitemap.
- **Implemented:** Experimental `/chat` interface connects directly from the browser to same-device Ollama `/api/tags` and streaming `/api/chat`, stores conversation history in browser local storage, and supports model refresh, message cancellation, and conversation deletion.
- **Implemented:** `/developer` provides streamed coding assistance through local Ollama, selectable task/personality/language, source-text context, and a searchable reference library with personal cheat sheets stored in browser local storage.
- **Not implemented:** Developer Mode does not edit project files, run terminal commands, tests, builds, scans, or Git actions. It does not provide sandboxed execution, code diffs, backups, or undo. See `docs/developer-mode.md`.
- **Implemented:** GitHub repository/release URLs can be configured with `VITE_GITHUB_REPO` and `VITE_GITHUB_RELEASES_URL`.
- **Implemented:** Download Center fetches the public stable-release list from GitHub at runtime, detects OS/architecture conservatively, and links only same-repository assets matching a known Windows, macOS, or Linux package pattern. Missing packages are Coming soon; if GitHub cannot be reached, no direct downloads are shown. Publisher-provided SHA-256 appears only when present.
- **Not present:** Dedicated language support, release notes, tutorials, roadmap, security reporting, community showcase, developer/API reference, and marketplace-information pages. Documentation content is currently short static guidance rather than a full docs system.
- **Not present:** Automated tests, accessibility tests, multilingual coverage, or performance tests.

## Assistant capabilities

The desktop shell is only a local Ollama text-chat preview; the following broader capabilities must not be marketed as implemented:

- Cloud providers, multimodal understanding, knowledge retrieval, and native persistent conversations.
- Language detection, translation, speech recognition, text-to-speech, language packs, and RTL interface support.
- Voice, wake word, audio device management, and interruption.
- Operating-system control, browser automation, permissions, activity logs, and emergency stop.
- System health, workflows, productivity data, documents, integrations, agents, memory, skills/plugins, security centre, updates, diagnostics, backups, and rollback.
- Windows installer generation has a configured GitHub Actions workflow but has not yet run; no installer is published. macOS and Linux installers are not currently built.

## Non-negotiable release truth

The website is a functioning marketing/documentation app and the Tauri shell provides only local text chat through Ollama. Do not infer implementation from planned copy. Do not claim an installer is available or a platform is supported until the actual package has been published and tested.
