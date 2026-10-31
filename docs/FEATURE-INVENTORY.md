# JARVIS feature inventory

Inventory date: 2025-02-21

This inventory reflects the repository inspected for the expansion roadmap. “Implemented” means present in the current source, not simply described as a product goal.

## Repository and architecture

- **Implemented:** Vite + React 19 + TypeScript client-side application; React Router routes live in `src/App.tsx`; Tailwind and shadcn/Radix UI dependencies are available.
- **Implemented:** Website code is in `src/`, static assets in `public/`, deployment configuration includes Vercel routing.
- **Not present:** Tauri, Rust, SQLite, desktop packaging, API/server layer, provider framework, automated test suite, CI, or platform adapters.
- **Deployment note:** This is currently a single Vite website project. There is no separate desktop project or independent desktop build yet.

## Website

- **Implemented:** Responsive dark-themed homepage, animated CSS orb, feature overview, download status page, documentation topic selector, FAQ accordion, privacy page, open-source page, mobile navigation, reduced-motion stylesheet, title/description updates, Open Graph metadata, favicon, robots file, and sitemap.
- **Implemented:** Experimental `/chat` interface connects directly from the browser to same-device Ollama `/api/tags` and streaming `/api/chat`, stores conversation history in browser local storage, and supports model refresh, message cancellation, and conversation deletion.
- **Implemented:** GitHub repository/release URLs can be configured with `VITE_GITHUB_REPO` and `VITE_GITHUB_RELEASES_URL`.
- **Honest limitation:** Download cards are explicitly “Coming soon”; the site does not fetch GitHub release metadata or asset checksums, and no packages are declared available.
- **Not present:** Dedicated language support, release notes, tutorials, roadmap, security reporting, community showcase, developer/API reference, and marketplace-information pages. Documentation content is currently short static guidance rather than a full docs system.
- **Not present:** Automated tests, accessibility tests, multilingual coverage, or performance tests.

## Assistant capabilities

These have no desktop implementation in this repository and must not be marketed as working features:

- AI chat, streaming, local/cloud providers, model selection, reasoning/task modes, multimodal understanding, knowledge retrieval, and searchable/persistent conversations.
- Language detection, translation, speech recognition, text-to-speech, language packs, and RTL interface support.
- Voice, wake word, audio device management, and interruption.
- Operating-system control, browser automation, permissions, activity logs, and emergency stop.
- System health, workflows, productivity data, documents, integrations, agents, memory, skills/plugins, security centre, updates, diagnostics, backups, and rollback.
- Windows/macOS/Linux applications and their installers.

## Non-negotiable release truth

The website is a functioning marketing/documentation shell; it is not a functioning desktop assistant. Do not infer implementation from planned copy. No release version, release date, package availability, tested platform claim, model compatibility, or language capability should be published until verified against actual artifacts and tests.
