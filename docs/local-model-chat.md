# Try the JARVIS local chat prototype

The `/chat` page in the current website can send text messages to an Ollama server on the same computer. This is a browser-based prototype, not the separate JARVIS Desktop application. It currently supports Ollama chat models that expose `/api/tags` and streaming `/api/chat` responses. It does not provide cloud providers, voice, image/document understanding, agent tools, or OS control.

## Requirements

- Ollama installed and running on the same computer as the browser.
- At least one model downloaded in Ollama.
- A browser allowed to connect to the local Ollama API.

The app checks `http://localhost:11434` by default. Use Local connection settings on the chat screen only if Ollama listens on a different loopback port. The chat only accepts loopback addresses (`localhost`, `127.0.0.1`, or `::1`) and does not accept remote endpoints.

## Browser-origin access and security

A browser-based website and a local Ollama server have different origins. The browser may block requests unless Ollama allows the exact origin from which JARVIS is loaded. Ollama's `OLLAMA_ORIGINS` setting can be used to allow trusted origins. Consult Ollama's official documentation for setting environment variables on your operating system; the exact procedure differs by platform.

Allow only the exact trusted JARVIS origin that you use. Do not use a wildcard origin or allow arbitrary websites. Anyone who can run scripts from an allowed origin could potentially send prompts to your local model. Do not expose Ollama's API to the public internet or an untrusted network.

## Data behavior

Conversation history and the configured loopback URL are stored in this browser's local storage. Prompts are sent directly from your browser to the configured local Ollama server. Clearing this browser's site data removes the saved chat history. This prototype does not encrypt local browser storage and does not include a secure credential store.

## Current limitations

- Conversations are stored in browser local storage, not SQLite, and are local to this browser profile.
- This is not a packaged desktop app; it does not yet have native tray, filesystem, system-health, or platform adapter capabilities.
- The model list and chat endpoint depend on Ollama API compatibility. The UI does not infer or certify a model's supported languages, context length, multimodal features, or reasoning behavior.
- A user can stop a streaming response, but no tools or computer actions are available.
- If the browser reports a connection failure, check that Ollama is running and that only the trusted JARVIS origin is allowed.
