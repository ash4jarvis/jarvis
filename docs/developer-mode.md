# Developer Mode

Developer Mode is available at `/developer` in the JARVIS website. It is an Ollama-backed browser workbench, not a native desktop IDE.

## Working features

- Send generation, explanation, refactoring, translation, documentation, test-generation, debugging, or teaching requests to a selected local Ollama model.
- Choose a programming language/framework and one of nine instructional developer personalities.
- Paste source/error context or select a supported plain-text code/document file up to 1 MB. File contents are read in the browser and included only when the user submits a request.
- Receive streamed model output, stop generation, and copy the result.
- Search the built-in quick-reference examples, filter by topic, copy snippets, and add a snippet to the workbench context.
- Create, search, copy, and delete personal cheat sheets. These are saved in browser local storage.

## Explicit limitations

No code is automatically run, edited, or written to a project. The result is an untrusted suggestion; review it before use. There is no file explorer, editor, diff/patch application, backup/undo, terminal, test runner, build runner, dependency audit, vulnerability scanner, Git/GitHub integration, project scaffolder, sandbox, or native filesystem permission layer. “Generate tests” returns suggested test text; it does not execute tests. “Debug” analyzes the supplied text; it does not inspect a running process. The reference library is a small starter set, not an exhaustive or independently audited language reference.

## Privacy and security

Requests and included source text are sent from the browser directly to the configured local Ollama endpoint. The endpoint must be loopback-only. File contents are not sent until the user submits the prompt. Do not include credentials, private keys, tokens, customer data, or other sensitive material. Ollama must allow the exact trusted web origin in its browser-origin configuration; avoid wildcard origins and do not expose Ollama to untrusted networks.

Generated commands and code are never executed by this feature. Do not run suggested commands without understanding them and checking the target directory and effects. Security education is constrained to defensive, authorized contexts; this interface does not conduct scans or penetration tests.

For local model setup and browser-origin guidance, see [local model chat](local-model-chat.md).
