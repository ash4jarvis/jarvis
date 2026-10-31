# JARVIS feature inventory

Inventory date: 2026-10-31

This inventory reflects the repository inspected for the expansion roadmap. “Implemented” means present in the current source, not simply described as a product goal.

## Repository and architecture

- **Implemented:** Vite + React 19 + TypeScript client-side application; React Router routes live in `src/App.tsx`; Tailwind and shadcn/Radix UI dependencies are available.
- **Implemented:** Website code is in `src/`, static assets in `public/`, deployment configuration includes Vercel routing.
- **Implemented:** A Tauri 2 / Rust desktop preview shell with a separate Vite frontend entry and cross-platform Windows/macOS/Linux installer workflows.
- **Not present:** SQLite, a remote app server, a generic extensible provider framework, automated test suite, or phone/computer-control adapters. Native Tauri commands have been added for Gemini credential storage and API requests but still require compilation and runtime checks.
- **Deployment note:** The website remains the root Vite app. Desktop UI uses `desktop-ui/`, `vite.desktop.config.ts`, and `src-tauri/`; it has independent web and native build scripts. Cross-platform installer jobs are configured but have not yet run.

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

The desktop shell source now defaults to Gemini API chat with optional local Ollama, editable person/assistant names, dark/light appearance, push-to-talk input, and optional speech output. Gemini's Rust credential/API layer has not been compiled or runtime-tested on Windows, and speech support is WebView-dependent. The following broader capabilities must not be marketed as implemented:

- Additional cloud providers beyond Gemini, multimodal understanding, knowledge retrieval, and native persistent conversations. Gemini key storage, model discovery, and chat commands are added in source but have not been compiled or runtime-tested on Windows.
- Language detection, translation, speech recognition, text-to-speech, language packs, and RTL interface support.
- Native voice permissions, voice/device selection, wake word, background listening, streaming speech, and verified cross-platform voice support.
- Operating-system control, browser automation, permissions, activity logs, and emergency stop.
- Secure phone pairing, iOS/Android companion apps, call answering, SMS reading/sending, and voice-controlled communication.
- REA-based website/application reverse engineering inside the desktop app. REA is a separate tool and is not bundled or integrated.
- System health, workflows, productivity data, documents, integrations, agents, memory, skills/plugins, security centre, updates, diagnostics, backups, and rollback.
- Windows, macOS, and Linux installer generation is configured in GitHub Actions but has not yet run for this version.
- Gemini cloud provider UI and native secure-key/API code are implemented in source but await native build and end-to-end verification. Additional cloud providers are not implemented. Gemini API credentials and billing are separate from a consumer Gemini subscription; confirm the Google AI Studio project/key and billing terms before enabling cloud calls.

## Non-negotiable release truth

The website is a functioning marketing/documentation app. The Tauri desktop source provides Gemini/Ollama provider selection with basic personalization and WebView-dependent voice prototypes, but the native Gemini path and installer still need Windows build and runtime validation. Do not infer implementation from planned copy. Do not claim an installer is available or a platform is supported until the actual package has been published and tested.
