# Try the JARVIS local chat prototype

The `/chat` page in the current website can send text messages to an Ollama server on the same computer. This is a browser-based prototype. The early JARVIS Desktop preview reuses the same Ollama chat inside a Tauri webview; it is not yet the full native assistant. It currently supports Ollama chat models that expose `/api/tags` and streaming `/api/chat` responses. It does not provide cloud providers, voice, image/document understanding, agent tools, or OS control.

## Requirements

- Ollama installed and running on the same computer as the browser.
- At least one model downloaded in Ollama.
- A browser or desktop webview allowed to connect to the local Ollama API.

The app checks `http://127.0.0.1:11434` by default. Install a model such as `qwen3:4b` in Ollama before starting a conversation. Use Local connection settings on the chat screen only if Ollama listens on a different loopback port. The chat only accepts loopback addresses (`localhost`, `127.0.0.1`, or `::1`) and does not accept remote endpoints.

## Browser and desktop-webview origins and security

A browser-based website or desktop webview and a local Ollama server have different origins. Requests may be blocked unless Ollama allows the exact origin from which JARVIS is loaded. The Tauri webview origin is commonly `http://tauri.localhost` on Windows and `tauri://localhost` on macOS/Linux. Ollama's `OLLAMA_ORIGINS` setting can allow trusted origins; consult Ollama's official documentation for OS-specific configuration.

Allow only the exact trusted JARVIS origin that you use. Do not use a wildcard origin or allow arbitrary websites. Anyone who can run scripts from an allowed origin could potentially send prompts to your local model. Do not expose Ollama's API to the public internet or an untrusted network.

## Data behavior

Conversation history and the configured loopback URL are stored in browser or desktop-webview local storage. Prompts are sent directly to the configured local Ollama server. This storage is not encrypted and there is no secure credential store.

## Current limitations

- Conversations are stored in browser local storage, not SQLite, and are local to this browser profile.
- The Windows installer workflow is configured but has not yet produced a package. The desktop shell does not have native tray, filesystem, system-health, or platform-adapter capabilities. See [the desktop preview guide](desktop-preview.md).
- The model list and chat endpoint depend on Ollama API compatibility. The UI does not infer or certify a model's supported languages, context length, multimodal features, or reasoning behavior.
- A user can stop a streaming response, but no tools or computer actions are available.
- If the connection fails, check that Ollama is running and allows only the exact trusted website or desktop-webview origin.
