# JARVIS implementation roadmap

This roadmap is dependency-aware and based on the current repository inventory. The project is currently a Vite/React/TypeScript website only. Work must be delivered in small, testable phases; a capability is not complete until implemented, tested, documented, and accurately described on the site.

## Phase 0 — Stability and project boundaries

1. Add project ownership and contribution documentation, MIT `LICENSE`, environment example, and verified dependency/licence inventory.
2. Add automated website tests, lint/type/build checks, accessibility checks, and CI.
3. Define the monorepo boundary without changing the independently deployable website: keep current website at repository root and place desktop under `desktop/` (Tauri 2 + React/TypeScript UI + Rust core); keep shared contracts isolated and avoid coupling website deployment to desktop dependencies.
4. Document threat model, local data classification, permission model, supported-platform test matrix, and secrets policy.

**Exit criteria:** Existing site passes checks; repository structure and licence are explicit; desktop package can be added without destabilizing web builds.

## Phase 1 — Website completion

1. Preserve current routes and navigation; add missing language support, roadmap, release notes, security reporting, tutorials, developer/API, and community/marketplace information pages.
2. Improve documentation discoverability and add accurate status labels; avoid implying unshipped features work.
3. Add environment examples and deployment documentation. If a release feed is implemented, read official release metadata and link only verified assets; otherwise keep all packages Coming soon.
4. Test responsive navigation, keyboard and screen-reader behavior, reduced motion, route metadata, and link integrity.

**Exit criteria:** Every promised website page exists and is navigable, metadata is correct, downloads never fabricate assets, and the site can be deployed independently.

## Phase 2 — Desktop foundation

1. Add independently buildable Tauri 2 application and capability detection. Keep OS-specific operations behind Windows/macOS/Linux adapters.
2. Implement app shell/navigation, settings, accessibility/theme preferences, structured activity log, emergency stop, and permission UX. Unsupported capabilities must be visibly disabled with a reason.
3. Add SQLite schema/migrations, local conversation storage, backup/export/delete, and data-retention controls. Define encryption boundaries before storing secrets or sensitive data.
4. Add desktop integration and platform smoke tests; do not claim an OS supported until the relevant build and core flows have been tested there.

**Exit criteria:** Clean desktop app starts on each validated target, persists local data safely, and has meaningful user-visible permission and stop controls.

## Phase 3 — AI provider framework and multilingual text chat

1. Define provider/model capability contracts (context limits, streaming, tools, image/audio support, language claims, privacy and local/cloud location).
2. Implement one local provider first; add optional cloud providers only through explicit configuration and secure credential storage. No keys in web bundles or source.
3. Implement streaming chat, cancel/interrupt, context handling, mode/personality/system-instruction configuration, and searchable/exportable conversations.
4. Add language detection and translation as explicit model-dependent capabilities. Start with a tested language matrix; never imply hundreds of verified languages. Add RTL layout tests.
5. Add provider failure, cancellation, long-context, and multilingual tests before exposing corresponding claims.

**Exit criteria:** Capability-aware model selection; honest local/cloud indicators; tested text conversation in the documented language set.

## Phase 4 — Voice

1. Build microphone permission/device selection, push-to-talk, mute and clear activity indicators.
2. Add speech recognition and text-to-speech as independently capability-declared adapters, including offline options where tested.
3. Add streaming/interruptible speech and configurable voice/speed where providers support it; test mixed language and supported accents.
4. Wake word and hands-free/full-duplex are opt-in, disabled by default, and only added after resource/privacy review.

## Phase 5 — Safe computer control and integrations

1. Define narrow, typed, allowlisted actions and platform adapters; implement read-only capability detection first.
2. Add per-action permission prompts and audit trail. Require confirmation for destructive, privileged, external, or irreversible actions.
3. Never execute arbitrary model-generated shell commands. Browser, clipboard, screen, file, email, calendar, messaging, and web tools each require their own explicit consent and scoped permissions.
4. Add cross-platform tests and adversarial prompt-injection/security tests before enabling actions.

## Phase 6 — Productivity, documents, memory, and knowledge

1. Add local notes/tasks/reminders and data export/restore before calendar or cloud sync.
2. Add document parsing/creation by format with clear fidelity limits and untrusted-content handling.
3. Add user-editable memory with view/search/export/delete and explicit enablement.
4. Add local knowledge indexing/retrieval with source references, deletion/re-index controls, and permission boundaries.

## Phase 7 — Automation, agents, and plugins

1. Add manual workflows first, then schedules/triggers with pause, approval checkpoints, logs, and bounded permissions.
2. Add specialist agents as supervised jobs with visible plans/progress, approval gates, cancellation, and output review.
3. Add plugin manifests, signed/review status where feasible, compatibility/licence metadata, isolated permissions, install/remove/version controls. Never silently install or trust third-party code.

## Phase 8 — Operations, security, and release

1. Add user-controlled diagnostics and telemetry off by default; provide local logs, repair guidance, backup-before-update, and rollback where feasible.
2. Complete threat-model review, dependency/model/dataset licence audit, secure storage review, accessibility, performance, localization, and platform security tests.
3. Build/sign/package each platform separately: Windows EXE/MSI, macOS Apple Silicon/Intel DMG/app, Linux AppImage/DEB. Publish only artifacts actually built and tested, with checksums, release notes, installation instructions, and SBOM/licence notices.
4. Wire the site download center to official release assets only after publication; preserve Coming soon for absent artifacts.

## Immediate next work

Complete Phase 0 documentation and checks first. Then finish the missing website information pages and automated tests before creating the desktop subproject. Do not attempt to implement all requested product areas in one change.

## Definition of done for every capability

- Working implementation integrated into the product, not a static mock.
- Permission, privacy, failure, cancellation, and unsupported-platform behavior considered.
- Automated tests at the appropriate boundary and manual platform validation where hardware/OS access is needed.
- User documentation and accurate website status.
- Third-party redistribution terms independently checked.
