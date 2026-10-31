import { FormEvent, KeyboardEvent, useCallback, useEffect, useRef, useState } from "react";
import { Activity, ArrowUp, Check, ChevronDown, Menu, MessageSquarePlus, Mic, RefreshCw, Settings2, Shield, Trash2, X } from "lucide-react";
import { readPreferences, PREFERENCES_KEY, type AssistantPreferences } from "@/lib/assistantPreferences";
import { invoke, isTauri } from "@tauri-apps/api/core";

type Message = { role: "user" | "assistant"; content: string };
type Conversation = { id: string; title: string; updatedAt: number; messages: Message[] };
type Provider = "ollama" | "gemini";
type ProviderModel = { name: string; displayName?: string };
const STORE_KEY = "jarvis.local-chat.conversations.v1";
const ENDPOINT_KEY = "jarvis.local-chat.endpoint.v1";
const PROVIDER_KEY = "jarvis.provider.v1";
const DEFAULT_ENDPOINT = "http://127.0.0.1:11434";

type SpeechRecognitionResult = { transcript: string };
type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: { results: ArrayLike<ArrayLike<SpeechRecognitionResult>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};
type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

function readConversations(): Conversation[] {
  try {
    const saved = localStorage.getItem(STORE_KEY);
    return saved ? JSON.parse(saved) as Conversation[] : [];
  } catch { return []; }
}

function OrbMark() { return <span className="chat-orb-mark" aria-hidden="true"><i/><i/><i/></span>; }

function youtubeQueryFromCommand(text: string) {
  const patterns = [
    /^(?:hey\s+)?(?:jarvis[, ]+)?(?:please\s+)?play\s+(.+?)\s+(?:on|in)\s+(?:youtube|yt)(?:\s+please)?[.!?]*$/i,
    /^(?:hey\s+)?(?:jarvis[, ]+)?(?:please\s+)?search\s+(?:for\s+)?(.+?)\s+(?:on|in)\s+(?:youtube|yt)(?:\s+please)?[.!?]*$/i,
    /^(?:hey\s+)?(?:jarvis[, ]+)?(?:please\s+)?search\s+youtube\s+for\s+(.+?)[.!?]*$/i,
  ];
  for (const pattern of patterns) {
    const match = text.trim().match(pattern);
    if (match?.[1]?.trim()) return match[1].trim().replace(/^['"“”]|['"“”]$/g, "");
  }
  return "";
}

export default function Chat() {
  const [conversations, setConversations] = useState<Conversation[]>(readConversations);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [provider, setProvider] = useState<Provider>(() => !isTauri() ? "ollama" : localStorage.getItem(PROVIDER_KEY) === "ollama" ? "ollama" : "gemini");
  const [models, setModels] = useState<ProviderModel[]>([]);
  const [model, setModel] = useState("");
  const [geminiKeyDraft, setGeminiKeyDraft] = useState("");
  const [geminiKeySaved, setGeminiKeySaved] = useState(false);
  const [keyBusy, setKeyBusy] = useState(false);
  const [endpoint, setEndpoint] = useState(() => localStorage.getItem(ENDPOINT_KEY) || DEFAULT_ENDPOINT);
  const [draft, setDraft] = useState("");
  const [status, setStatus] = useState<"checking" | "connected" | "no-model" | "offline">("checking");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [endpointDraft, setEndpointDraft] = useState(endpoint);
  const [preferences, setPreferences] = useState<AssistantPreferences>(readPreferences);
  const [listening, setListening] = useState(false);
  const [voiceNotice, setVoiceNotice] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const active = conversations.find(item => item.id === conversationId) || null;

  useEffect(() => { localStorage.setItem(STORE_KEY, JSON.stringify(conversations)); }, [conversations]);
  useEffect(() => { localStorage.setItem(PROVIDER_KEY, provider); }, [provider]);
  useEffect(() => { localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences)); }, [preferences]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [active?.messages, busy]);
  useEffect(() => { document.title = "Chat — JARVIS"; }, []);
  useEffect(() => () => { recognitionRef.current?.stop(); if ("speechSynthesis" in window) window.speechSynthesis.cancel(); }, []);
  useEffect(() => { if (isTauri()) void invoke<boolean>("has_gemini_api_key").then(setGeminiKeySaved).catch(() => setGeminiKeySaved(false)); }, []);

  const refreshModels = useCallback(async () => {
    setStatus("checking"); setNotice("");
    try {
      let available: ProviderModel[];
      if (provider === "gemini") {
        if (!isTauri()) throw new Error("Gemini providers are available in the JARVIS desktop app.");
        available = await invoke<ProviderModel[]>("list_gemini_models");
      } else {
        const response = await fetch(`${endpoint.replace(/\/$/, "")}/api/tags`, { signal: AbortSignal.timeout(5000) });
        if (!response.ok) throw new Error(`Ollama returned ${response.status}.`);
        const data = await response.json() as { models?: ProviderModel[] };
        available = data.models || [];
      }
      setModels(available); setModel(current => available.some(item => item.name === current) ? current : available.find(item => item.name === "qwen3:4b")?.name || available[0]?.name || "");
      setStatus(available.length ? "connected" : "no-model");
      setNotice(available.length ? "" : provider === "gemini" ? "No Gemini text models are available for this API key." : "Ollama is running, but no models are installed. Add a model in Ollama, then check again.");
    } catch (error) {
      setModels([]); setModel(""); setStatus("offline");
      setNotice(error instanceof Error && error.message ? error.message : provider === "gemini" ? "Add a Gemini API key in Preferences, then refresh models." : "Can't reach Ollama. Start Ollama and allow this WebView origin.");
    }
  }, [endpoint, provider]);

  useEffect(() => { void refreshModels(); }, [refreshModels]);

  const newConversation = () => { setConversationId(null); setDraft(""); setNotice(""); setSidebarOpen(false); textareaRef.current?.focus(); };
  const deleteConversation = (id: string) => {
    setConversations(current => current.filter(item => item.id !== id));
    if (conversationId === id) setConversationId(null);
  };
  const saveEndpoint = () => {
    const cleaned = endpointDraft.trim().replace(/\/$/, "");
    try {
      const parsed = new URL(cleaned);
      if (!(["localhost", "127.0.0.1", "::1", "[::1]"].includes(parsed.hostname)) || !["http:", "https:"].includes(parsed.protocol)) {
        setNotice("For local-first safety, use an Ollama address on this device (localhost or 127.0.0.1)."); return;
      }
      localStorage.setItem(ENDPOINT_KEY, cleaned); setEndpoint(cleaned); setSettingsOpen(false);
    } catch { setNotice("Enter a valid local Ollama URL, such as http://127.0.0.1:11434."); }
  };

  const saveGeminiKey = async () => {
    if (!isTauri() || !geminiKeyDraft.trim()) { setNotice("Enter your Gemini API key first."); return; }
    const alreadyUsingGemini = provider === "gemini";
    setKeyBusy(true);
    try {
      await invoke("save_gemini_api_key", { apiKey: geminiKeyDraft.trim() });
      setGeminiKeySaved(true); setGeminiKeyDraft(""); setProvider("gemini");
      if (alreadyUsingGemini) await refreshModels();
    } catch (error) { setNotice(error instanceof Error ? error.message : String(error)); }
    finally { setKeyBusy(false); }
  };

  const removeGeminiKey = async () => {
    if (!isTauri()) return;
    setKeyBusy(true);
    try {
      await invoke("delete_gemini_api_key"); setGeminiKeySaved(false); setGeminiKeyDraft(""); setModels([]); setModel("");
      if (provider === "gemini") { setStatus("offline"); setNotice("Gemini API key removed from the operating system credential store."); }
    } catch (error) { setNotice(error instanceof Error ? error.message : String(error)); }
    finally { setKeyBusy(false); }
  };

  const sendMessage = async (event?: FormEvent) => {
    event?.preventDefault();
    const text = draft.trim();
    const youtubeQuery = youtubeQueryFromCommand(text);
    if (!text || busy || (!model && !youtubeQuery)) return;
    if (youtubeQuery) {
      if (!isTauri()) { setNotice("YouTube voice and computer actions are available in the installed JARVIS desktop app."); return; }
      setBusy(true); setDraft(""); setNotice("");
      try {
        await invoke("open_youtube_search", { query: youtubeQuery });
        const id = conversationId || crypto.randomUUID();
        setConversationId(id);
        const userMessage: Message = { role: "user", content: text };
        const assistantMessage: Message = { role: "assistant", content: `Opening YouTube search results for “${youtubeQuery}”. Choose a video to play.` };
        const title = text.length > 48 ? `${text.slice(0, 45)}…` : text;
        setConversations(current => {
          const existing = current.find(item => item.id === id);
          if (existing) return current.map(item => item.id === id ? { ...item, updatedAt: Date.now(), messages: [...item.messages, userMessage, assistantMessage] } : item);
          return [{ id, title, updatedAt: Date.now(), messages: [userMessage, assistantMessage] }, ...current];
        });
      } catch (error) {
        setNotice(error instanceof Error ? error.message : String(error));
      } finally { setBusy(false); }
      return;
    }
    const id = conversationId || crypto.randomUUID();
    setConversationId(id); setDraft(""); setNotice(""); setBusy(true);
    const userMessage: Message = { role: "user", content: text };
    const assistantMessage: Message = { role: "assistant", content: "" };
    const title = text.length > 48 ? `${text.slice(0, 45)}…` : text;
    setConversations(current => {
      const existing = current.find(item => item.id === id);
      if (existing) return current.map(item => item.id === id ? { ...item, updatedAt: Date.now(), messages: [...item.messages, userMessage, assistantMessage] } : item);
      return [{ id, title, updatedAt: Date.now(), messages: [userMessage, assistantMessage] }, ...current];
    });
    const controller = new AbortController(); abortRef.current = controller;
    try {
      if (provider === "gemini" && isTauri()) {
        const response = await invoke<string>("generate_gemini_response", {
          model,
          messages: [...(active?.messages || []), userMessage].map(({ role, content }) => ({ role, content })),
          systemInstruction: `Your name is ${preferences.assistantName}.${preferences.personName ? ` The user's name is ${preferences.personName}; address them naturally by their name when it fits.` : ""}`,
        });
        setConversations(current => current.map(item => item.id === id ? { ...item, messages: item.messages.map((message, index) => index === item.messages.length - 1 ? { ...message, content: response } : message) } : item));
        if (preferences.voiceOutput && "speechSynthesis" in window) {
          window.speechSynthesis.cancel(); window.speechSynthesis.speak(new SpeechSynthesisUtterance(response));
        }
        return;
      }
      const response = await fetch(`${endpoint.replace(/\/$/, "")}/api/chat`, {
        method: "POST", headers: { "Content-Type": "application/json" }, signal: controller.signal,
        body: JSON.stringify({ model, stream: true, messages: [{ role: "system" as const, content: `Your name is ${preferences.assistantName}.${preferences.personName ? ` The user's name is ${preferences.personName}; address them naturally by their name when it fits.` : ""}` }, ...(active?.messages || []), userMessage].map(({ role, content }) => ({ role, content })) }),
      });
      if (!response.ok || !response.body) {
        const detail = await response.text(); throw new Error(detail || `Ollama returned ${response.status}.`);
      }
      const reader = response.body.getReader(); const decoder = new TextDecoder(); let buffer = ""; let accumulated = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n"); buffer = lines.pop() || "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const chunk = JSON.parse(line) as { message?: { content?: string }; error?: string };
          if (chunk.error) throw new Error(chunk.error);
          accumulated += chunk.message?.content || "";
          setConversations(current => current.map(item => item.id === id ? { ...item, messages: item.messages.map((message, index) => index === item.messages.length - 1 ? { ...message, content: accumulated } : message) } : item));
        }
      }
      if (buffer.trim()) {
        const last = JSON.parse(buffer) as { message?: { content?: string }; error?: string };
        if (last.error) throw new Error(last.error);
        accumulated += last.message?.content || "";
        setConversations(current => current.map(item => item.id === id ? { ...item, messages: item.messages.map((message, index) => index === item.messages.length - 1 ? { ...message, content: accumulated } : message) } : item));
      }
      if (!accumulated && !controller.signal.aborted) setNotice("The model returned an empty response.");
      if (accumulated && preferences.voiceOutput && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(new SpeechSynthesisUtterance(accumulated));
      }
    } catch (error) {
      if (!controller.signal.aborted && (!(error instanceof Error) || error.name !== "AbortError")) {
        const message = error instanceof Error ? error.message : String(error);
        setNotice(message.includes("Failed to fetch") ? "The local connection failed. Check Ollama is running and allows this website or desktop WebView origin." : message);
        setConversations(current => current.map(item => item.id === id ? { ...item, messages: item.messages.filter((_, index) => index !== item.messages.length - 1 || Boolean(item.messages[index].content)) } : item));
      } else if (controller.signal.aborted) {
        setConversations(current => current.map(item => item.id === id ? { ...item, messages: item.messages.filter((_, index) => index !== item.messages.length - 1 || Boolean(item.messages[index].content)) } : item));
      }
    } finally { setBusy(false); abortRef.current = null; }
  };

  const handleKeys = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void sendMessage(); }
  };

  const toggleVoiceInput = () => {
    if (listening) { recognitionRef.current?.stop(); return; }
    if (!preferences.voiceInput) { setVoiceNotice("Turn on voice input in preferences first."); return; }
    const speechWindow = window as typeof window & { SpeechRecognition?: SpeechRecognitionConstructor; webkitSpeechRecognition?: SpeechRecognitionConstructor };
    const Recognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
    if (!Recognition) { setVoiceNotice("Speech recognition is unavailable in this WebView. You can still type your message."); return; }
    const recognition = new Recognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = event => {
      const transcript = event.results[0]?.[0]?.transcript;
      if (transcript) setDraft(current => current ? `${current} ${transcript}` : transcript);
    };
    recognition.onerror = () => { setListening(false); setVoiceNotice("Microphone input ended. Check microphone permission and try again."); };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    setVoiceNotice("");
    try { recognition.start(); setListening(true); }
    catch { setVoiceNotice("Could not start microphone input. Check microphone permission."); }
  };

  const updatePreference = <K extends keyof AssistantPreferences>(key: K, value: AssistantPreferences[K]) => {
    setPreferences(current => ({ ...current, [key]: value }));
  };


  return <div className={`assistant-shell ${preferences.theme === "light" ? "assistant-theme-light" : ""}`}>
    <aside className={`assistant-sidebar ${sidebarOpen ? "sidebar-visible" : ""}`}>
      <div className="assistant-brand"><a href="/" className="assistant-brand-link"><OrbMark/> {preferences.assistantName}</a><button className="icon-button mobile-close" aria-label="Close sidebar" onClick={() => setSidebarOpen(false)}><X size={17}/></button></div>
      <a className="chat-guide-link" href="/local-model-chat.html">Local setup &amp; privacy guide ↗</a>
      <button className="new-chat-button" onClick={newConversation}><MessageSquarePlus size={16}/> New conversation</button>
      <div className="history-label">RECENT CONVERSATIONS</div>
      <div className="history-list">{conversations.length ? conversations.map(item => <div className={`history-item ${item.id === conversationId ? "history-active" : ""}`} key={item.id}><button onClick={() => { setConversationId(item.id); setSidebarOpen(false); }}>{item.title}</button><button className="delete-chat" title="Delete conversation" aria-label={`Delete ${item.title}`} onClick={() => deleteConversation(item.id)}><Trash2 size={13}/></button></div>) : <p className="empty-history">Your conversations stay on this device.</p>}</div>
      <div className="sidebar-bottom"><div className="connection-status"><span className={`connection-dot ${status}`}/><span>{status === "connected" ? `${provider === "gemini" ? "Gemini" : "Local model"} connected` : status === "checking" ? `Checking ${provider === "gemini" ? "Gemini" : "Ollama"}…` : status === "no-model" ? "No model available" : `${provider === "gemini" ? "Gemini" : "Ollama"} not connected`}</span></div><button className="sidebar-setting" onClick={() => { setEndpointDraft(endpoint); setSettingsOpen(true); }}><Settings2 size={15}/> Provider &amp; preferences</button><a className="back-site" href="/">← Back to JARVIS home</a></div>
    </aside>
    {sidebarOpen && <button className="sidebar-backdrop" aria-label="Close navigation" onClick={() => setSidebarOpen(false)}/>}
    <main className="assistant-main">
      <header className="assistant-topbar"><div className="assistant-top-left"><button className="icon-button menu-trigger" aria-label="Open conversation history" onClick={() => setSidebarOpen(true)}><Menu size={18}/></button><div className="chat-context"><span>{provider === "gemini" ? "GEMINI CLOUD" : "LOCAL OLLAMA"}</span><span className="context-divider">/</span><b>{active?.title || "New conversation"}</b></div></div><div className="assistant-top-actions">{isTauri() && <select className="provider-select" aria-label="AI provider" value={provider} onChange={event => { const next = event.target.value as Provider; setProvider(next); setModel(""); setModels([]); }}><option value="gemini">Gemini</option><option value="ollama">Ollama · Local</option></select>}<div className="model-picker"><span className="model-indicator"/><select aria-label={`Select ${provider} AI model`} value={model} onChange={event => setModel(event.target.value)} disabled={!models.length}>{models.length ? models.map(item => <option value={item.name} key={item.name}>{item.displayName || item.name}</option>) : <option value="">{provider === "gemini" ? "Add API key" : "No model found"}</option>}</select><ChevronDown size={13}/></div><button className="icon-button" aria-label="Refresh AI models" title="Refresh models" onClick={() => void refreshModels()}><RefreshCw size={15}/></button><button className="icon-button" aria-label="Connection settings" onClick={() => { setEndpointDraft(endpoint); setSettingsOpen(true); }}><Settings2 size={16}/></button></div></header>
      <div className="chat-scroller">
        {!active ? <section className="welcome-panel"><div className="welcome-orb"><OrbMark/></div><div className="welcome-eyebrow"><span className="connection-dot"/> PERSONAL ASSISTANT · {provider === "gemini" ? "GEMINI CLOUD" : "LOCAL OLLAMA"}</div><h1>{preferences.personName ? `Hello, ${preferences.personName}.` : "What can I help"}<br/><em>{preferences.personName ? "What shall we work on?" : "you think through?"}</em></h1><p>{provider === "gemini" ? "Chat with Gemini using your own API key. Your conversation is sent to Google for a response and saved in this browser." : "Choose a model running on your device. Your conversation is saved in this browser."}</p><div className="suggestion-grid">{["Explain a complex idea simply", "Help me plan my week", "Review this piece of writing"].map((item, index) => <button key={item} onClick={() => { setDraft(item); textareaRef.current?.focus(); }}><span>0{index + 1}</span>{item}</button>)}</div>{(status === "offline" || status === "no-model") && <div className="setup-prompt"><Activity size={15}/><span>{status === "offline" ? provider === "gemini" ? "Add a Gemini API key in preferences, then check your connection." : "Start Ollama and check its WebView-origin access in preferences." : provider === "gemini" ? "No text models are available to this API key. Check API access and try again." : "Ollama is running. Install a model in Ollama to begin chatting."}</span><button onClick={() => void refreshModels()}>Check again</button></div>}</section> : <section className="message-list" aria-live="polite">{active.messages.map((message, index) => <article className={`chat-message ${message.role}`} key={`${active.id}-${index}`}><div className="message-avatar">{message.role === "user" ? (preferences.personName || "Y").slice(0, 1).toUpperCase() : <OrbMark/>}</div><div className="message-content"><div className="message-author">{message.role === "user" ? preferences.personName || "You" : preferences.assistantName}</div><p>{message.content || (busy && index === active.messages.length - 1 ? <span className="typing-indicator"><i/><i/><i/></span> : "")}</p></div></article>)}{busy && <div className="streaming-label"><span className="connection-dot connected"/> Generating with {provider === "gemini" ? "Gemini" : "Ollama"}{provider === "ollama" && <> · <button onClick={() => abortRef.current?.abort()}>Stop response</button></>}</div>}</section>}
        {notice && <div className={`chat-notice ${status === "offline" || status === "no-model" ? "notice-warning" : ""}`} role="status">{notice}<button onClick={() => setNotice("")} aria-label="Dismiss message"><X size={14}/></button></div>}
        <div ref={bottomRef}/>
      </div>
      <div className="composer-zone">{voiceNotice && <div className="chat-notice" role="status">{voiceNotice}<button onClick={() => setVoiceNotice("")} aria-label="Dismiss message"><X size={14}/></button></div>}<form className="composer" onSubmit={sendMessage}><textarea ref={textareaRef} value={draft} onChange={event => setDraft(event.target.value)} onKeyDown={handleKeys} placeholder={model ? `Message ${preferences.assistantName}… (try “play TMKOC on YouTube”)` : provider === "gemini" ? "Set up Gemini to chat, or try “play TMKOC on YouTube”" : "Connect Ollama to chat, or try “play TMKOC on YouTube”"} aria-label={`Message ${preferences.assistantName}`} rows={1} disabled={busy}/><div className="composer-tools"><div className="composer-note"><Shield size={12}/> {provider === "gemini" ? "Sent to Google Gemini using your API key" : "Sent to your configured local Ollama only"}</div><div className="composer-buttons">{busy ? provider === "ollama" ? <button className="send-button stop-button" type="button" onClick={() => abortRef.current?.abort()} aria-label="Stop generating"><X size={17}/></button> : <button className="send-button stop-button" type="button" disabled aria-label="Waiting for Gemini"><Activity size={15}/></button> : <><button className={`send-button voice-button ${listening ? "is-listening" : ""}`} type="button" onClick={toggleVoiceInput} disabled={!model || busy} aria-label={listening ? "Stop voice input" : "Start voice input"} title={listening ? "Stop listening" : "Speak a message"}><Mic size={16}/></button><button className="send-button" type="submit" disabled={!draft.trim() || (!model && !youtubeQueryFromCommand(draft))} aria-label="Send message"><ArrowUp size={17}/></button></>}</div></div></form><div className="composer-disclaimer">{preferences.voiceOutput ? "Voice replies enabled · " : ""}{provider === "gemini" ? "Your messages are sent to Google. Gemini responses may be inaccurate." : "Your chosen local model may make mistakes."}</div></div>
    </main>
    {settingsOpen && <div className="settings-overlay" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setSettingsOpen(false); }}><section className="settings-dialog" role="dialog" aria-modal="true" aria-labelledby="settings-title"><div className="settings-heading"><div><div className="history-label">PROVIDER &amp; PERSONALIZATION</div><h2 id="settings-title">Preferences</h2></div><button className="icon-button" aria-label="Close settings" onClick={() => setSettingsOpen(false)}><X size={17}/></button></div>
      {isTauri() && <><div className="history-label settings-section-label">AI PROVIDER</div><label htmlFor="provider-select">Use JARVIS with</label><select id="provider-select" className="provider-settings-select" value={provider} onChange={event => { const next = event.target.value as Provider; setProvider(next); setModel(""); setModels([]); }}><option value="gemini">Google Gemini · Cloud</option><option value="ollama">Ollama · Local</option></select>{provider === "gemini" && <><label className="api-key-label" htmlFor="gemini-key">Gemini API key</label><input id="gemini-key" type="password" autoComplete="off" value={geminiKeyDraft} onChange={event => setGeminiKeyDraft(event.target.value)} placeholder={geminiKeySaved ? "Saved securely on this device" : "Paste your Gemini API key"}/><div className="settings-hint">{geminiKeySaved ? "A key is saved in your operating system credential store. It is never saved in browser storage." : "Your key is sent to JARVIS’s native layer and stored in your operating system credential store."} Messages are sent to Google when you chat with Gemini.</div><div className="settings-actions key-actions"><button className="settings-cancel" onClick={() => void refreshModels()}>Check Gemini</button>{geminiKeySaved && <button className="settings-cancel" disabled={keyBusy} onClick={() => void removeGeminiKey()}>Remove key</button>}<button className="settings-save" disabled={!geminiKeyDraft.trim() || keyBusy} onClick={() => void saveGeminiKey()}>{keyBusy ? "Saving…" : geminiKeySaved ? "Update key" : "Save key"}</button></div><a className="ollama-help" href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">Get a Gemini API key in Google AI Studio ↗</a></>}</>}
      <div className="history-label settings-section-label">PERSONALIZE YOUR ASSISTANT</div><div className="preference-grid"><label htmlFor="person-name">Your name</label><input id="person-name" maxLength={40} value={preferences.personName} onChange={event => updatePreference("personName", event.target.value)}/><label htmlFor="assistant-name">Assistant name</label><input id="assistant-name" maxLength={40} value={preferences.assistantName} onChange={event => updatePreference("assistantName", event.target.value)}/><label htmlFor="theme-select">Appearance</label><select id="theme-select" value={preferences.theme} onChange={event => updatePreference("theme", event.target.value as AssistantPreferences["theme"])}><option value="classic">Classic dark</option><option value="light">Light</option></select><label htmlFor="voice-in">Voice input</label><input id="voice-in" type="checkbox" checked={preferences.voiceInput} onChange={event => updatePreference("voiceInput", event.target.checked)}/><label htmlFor="voice-out">Speak replies aloud</label><input id="voice-out" type="checkbox" checked={preferences.voiceOutput} onChange={event => updatePreference("voiceOutput", event.target.checked)}/></div><p className="settings-hint">Preferences are saved on this device. Voice features depend on speech support and microphone permission in your WebView.</p>
      {provider === "ollama" && <><div className="history-label settings-section-label">LOCAL MODEL CONNECTION</div><label htmlFor="ollama-endpoint">Ollama address</label><input id="ollama-endpoint" value={endpointDraft} onChange={event => setEndpointDraft(event.target.value)} placeholder={DEFAULT_ENDPOINT}/><div className="settings-hint">Default: <code>{DEFAULT_ENDPOINT}</code>. On Windows, Ollama may need <code>OLLAMA_ORIGINS=http://tauri.localhost</code> set for the desktop app, followed by an Ollama restart.</div><div className="settings-actions"><button className="settings-save" onClick={saveEndpoint}>Save local address <ArrowUp size={14}/></button></div><a className="ollama-help" href="https://ollama.com/download" target="_blank" rel="noreferrer">Install Ollama ↗</a></>}
      </section></div>}
    <div className="assistant-badge"><span/><Check size={11}/> {provider === "gemini" ? "GEMINI CLOUD SESSION" : "LOCAL OLLAMA SESSION"}</div>
  </div>;
}

