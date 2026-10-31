# Desktop update security plan

Automatic updates are **not enabled** in the current preview. There is no updater plugin wired into the native app, no signed update manifest, and no update download path. The desktop release workflow therefore cannot install an update silently.

Enabling updates requires a release owner's signing setup first:

1. Generate a Tauri updater keypair using the official Tauri signing tools on a trusted machine. Keep the private key and password out of this repository and store them only as protected GitHub Actions secrets (`TAURI_SIGNING_PRIVATE_KEY` and `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`).
2. Review and commit the corresponding public key in the Tauri updater configuration. Do not ship an empty key, a sample key, or a key copied from another app.
3. Add the official `tauri-plugin-updater` Rust and JavaScript packages, explicitly register the plugin, and grant only its required capability permissions. The updater must check signed metadata over HTTPS and reject any invalid or missing signature before presenting an update.
4. Extend the native release workflow to sign every platform bundle and publish the plugin's correctly signed update manifest at the configured HTTPS endpoint. Keep the manifest endpoint on the official JARVIS GitHub release source; do not use client-provided or arbitrary URLs.
5. Require a visible user approval before installation, keep normal application launches available when the service is offline, and test valid signatures, modified packages, missing manifests, and version rollback behavior before release.

The current release workflow already checks that a `desktop-vX.Y.Z` tag matches `src-tauri/tauri.conf.json`. That version check is a prerequisite for the future signed update feed, not an updater implementation. Until the signing key, public key, manifest endpoint, and platform signing process are configured and tested, publish installers as manual downloads only.
