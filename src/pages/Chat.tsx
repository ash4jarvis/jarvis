import { FormEvent, KeyboardEvent, useCallback, useEffect, useRef, useState } from "react";
import { Activity, ArrowUp, Check, ChevronDown, Menu, MessageSquarePlus, RefreshCw, Settings2, Shield, Trash2, X } from "lucide-react";

type Message = { role: "user" | "assistant"; content: string };
type Conversation = { id: string; title: string; updatedAt: number; messages: Message[] };
type OllamaModel = { name: string };
const STORE_KEY = "jarvis.local-chat.conversations.v1";
const ENDPOINT_KEY = "jarvis.local-chat.endpoint.v1";
const DEFAULT_ENDPOINT = "http://localhost:11434";

function readConversations(): Conversation[] {
  try {
    const saved = localStorage.getItem(STORE_KEY);
    return saved ? JSON.parse(saved) as Conversation[] : [];
  } catch { return []; }
}

function OrbMark() { return <span className="chat-orb-mark" aria-hidden="true"><i/><i/><i/></span>; }

export default function Chat() {
  const [conversations, setConversations] = useState<Conversation[]>(readConversations);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [models, setModels] = useState<OllamaModel[]>([]);
  const [model, setModel] = useState("");
  const [endpoint, setEndpoint] = useState(() => localStorage.getItem(ENDPOINT_KEY) || DEFAULT_ENDPOINT);
  const [draft, setDraft] = useState("");
  const [status, setStatus] = useState<"checking" | "connected" | "offline">("checking");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [endpointDraft, setEndpointDraft] = useState(endpoint);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const active = conversations.find(item => item.id === conversationId) || null;

  useEffect(() => { localStorage.setItem(STORE_KEY, JSON.stringify(conversations)); }, [conversations]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [active?.messages, busy]);
  useEffect(() => { document.title = "Chat — JARVIS"; }, []);

  const refreshModels = useCallback(async () => {
    setStatus("checking"); setNotice("");
    try {
      const response = await fetch(`${endpoint.replace(/\/$/, "")}/api/tags`, { signal: AbortSignal.timeout(5000) });
      if (!response.ok) throw new Error(`Ollama returned ${response.status}.`);
      const data = await response.json() as { models?: OllamaModel[] };
      const available = data.models || [];
      setModels(available); setModel(current => available.some(item => item.name === current) ? current : available[0]?.name || "");
      setStatus("connected");
      setNotice(available.length ? "" : "Ollama is running, but no models are installed yet.");
    } catch (error) {
      setModels([]); setModel(""); setStatus("offline");
      setNotice(error instanceof Error && error.name === "TimeoutError" ? "Ollama did not respond in time." : "Can't reach Ollama. Start Ollama and check its local API connection.");
    }
  }, [endpoint]);

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
    } catch { setNotice("Enter a valid local Ollama URL, such as http://localhost:11434."); }
  };

  const sendMessage = async (event?: FormEvent) => {
    event?.preventDefault();
    const text = draft.trim();
    if (!text || busy || !model) return;
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
      const response = await fetch(`${endpoint.replace(/\/$/, "")}/api/chat`, {
        method: "POST", headers: { "Content-Type": "application/json" }, signal: controller.signal,
        body: JSON.stringify({ model, stream: true, messages: [...(active?.messages || []), userMessage].map(({ role, content }) => ({ role, content })) }),
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
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") {
        setNotice(error.message.includes("Failed to fetch") ? "The local connection failed. Check Ollama is running and its browser-origin access is enabled." : error.message);
        setConversations(current => current.map(item => item.id === id ? { ...item, messages: item.messages.filter((_, index) => index !== item.messages.length - 1 || Boolean(item.messages[index].content)) } : item));
      } else if (controller.signal.aborted) {
        setConversations(current => current.map(item => item.id === id ? { ...item, messages: item.messages.filter((_, index) => index !== item.messages.length - 1 || Boolean(item.messages[index].content)) } : item));
      }
    } finally { setBusy(false); abortRef.current = null; }
  };

  const handleKeys = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void sendMessage(); }
  };


  return <div className="assistant-shell">
    <aside className={`assistant-sidebar ${sidebarOpen ? "sidebar-visible" : ""}`}>
      <div className="assistant-brand"><a href="/" className="assistant-brand-link"><OrbMark/> JARVIS</a><button className="icon-button mobile-close" aria-label="Close sidebar" onClick={() => setSidebarOpen(false)}><X size={17}/></button></div>
      <a className="chat-guide-link" href="/local-model-chat.html">Local setup &amp; privacy guide ↗</a>
      <button className="new-chat-button" onClick={newConversation}><MessageSquarePlus size={16}/> New conversation</button>
      <div className="history-label">RECENT CONVERSATIONS</div>
      <div className="history-list">{conversations.length ? conversations.map(item => <div className={`history-item ${item.id === conversationId ? "history-active" : ""}`} key={item.id}><button onClick={() => { setConversationId(item.id); setSidebarOpen(false); }}>{item.title}</button><button className="delete-chat" title="Delete conversation" aria-label={`Delete ${item.title}`} onClick={() => deleteConversation(item.id)}><Trash2 size={13}/></button></div>) : <p className="empty-history">Your conversations stay on this device.</p>}</div>
      <div className="sidebar-bottom"><div className="connection-status"><span className={`connection-dot ${status}`}/><span>{status === "connected" ? "Local model connected" : status === "checking" ? "Checking local model…" : "Model offline"}</span></div><button className="sidebar-setting" onClick={() => { setEndpointDraft(endpoint); setSettingsOpen(true); }}><Settings2 size={15}/> Local connection settings</button><a className="back-site" href="/">← Back to JARVIS site</a></div>
    </aside>
    {sidebarOpen && <button className="sidebar-backdrop" aria-label="Close navigation" onClick={() => setSidebarOpen(false)}/>}
    <main className="assistant-main">
      <header className="assistant-topbar"><div className="assistant-top-left"><button className="icon-button menu-trigger" aria-label="Open conversation history" onClick={() => setSidebarOpen(true)}><Menu size={18}/></button><div className="chat-context"><span>PERSONAL ASSISTANT</span><span className="context-divider">/</span><b>{active?.title || "New conversation"}</b></div></div><div className="assistant-top-actions"><div className="model-picker"><span className="model-indicator"/><select aria-label="Select local AI model" value={model} onChange={event => setModel(event.target.value)} disabled={!models.length}>{models.length ? models.map(item => <option value={item.name} key={item.name}>{item.name}</option>) : <option value="">No model found</option>}</select><ChevronDown size={13}/></div><button className="icon-button" aria-label="Refresh local models" title="Refresh models" onClick={() => void refreshModels()}><RefreshCw size={15}/></button><button className="icon-button" aria-label="Connection settings" onClick={() => { setEndpointDraft(endpoint); setSettingsOpen(true); }}><Settings2 size={16}/></button></div></header>
      <div className="chat-scroller">
        {!active ? <section className="welcome-panel"><div className="welcome-orb"><OrbMark/></div><div className="welcome-eyebrow"><span className="connection-dot"/> PRIVATE BY DEFAULT · LOCAL MODEL</div><h1>What can I help<br/>you <em>think through?</em></h1><p>Choose a model running on your device and start a conversation. Your messages are kept in this browser.</p><div className="suggestion-grid">{["Explain a complex idea simply", "Help me plan my week", "Review this piece of writing"].map((item, index) => <button key={item} onClick={() => { setDraft(item); textareaRef.current?.focus(); }}><span>0{index + 1}</span>{item}</button>)}</div>{status === "offline" && <div className="setup-prompt"><Activity size={15}/><span>Start Ollama and install a model to begin chatting.</span><button onClick={() => void refreshModels()}>Check again</button></div>}</section> : <section className="message-list" aria-live="polite">{active.messages.map((message, index) => <article className={`chat-message ${message.role}`} key={`${active.id}-${index}`}><div className="message-avatar">{message.role === "user" ? "Y" : <OrbMark/>}</div><div className="message-content"><div className="message-author">{message.role === "user" ? "You" : "JARVIS"}</div><p>{message.content || (busy && index === active.messages.length - 1 ? <span className="typing-indicator"><i/><i/><i/></span> : "")}</p></div></article>)}{busy && <div className="streaming-label"><span className="connection-dot connected"/> Generating locally · <button onClick={() => abortRef.current?.abort()}>Stop response</button></div>}</section>}
        {notice && <div className={`chat-notice ${status === "offline" ? "notice-warning" : ""}`} role="status">{notice}<button onClick={() => setNotice("")} aria-label="Dismiss message"><X size={14}/></button></div>}
        <div ref={bottomRef}/>
      </div>
      <div className="composer-zone"><form className="composer" onSubmit={sendMessage}><textarea ref={textareaRef} value={draft} onChange={event => setDraft(event.target.value)} onKeyDown={handleKeys} placeholder={model ? "Message JARVIS… (Enter to send, Shift + Enter for new line)" : "Connect Ollama and select a model to start"} aria-label="Message JARVIS" rows={1} disabled={!model || busy}/><div className="composer-tools"><div className="composer-note"><Shield size={12}/> Sent to your configured local Ollama only</div>{busy ? <button className="send-button stop-button" type="button" onClick={() => abortRef.current?.abort()} aria-label="Stop generating"><X size={17}/></button> : <button className="send-button" type="submit" disabled={!draft.trim() || !model} aria-label="Send message"><ArrowUp size={17}/></button>}</div></form><div className="composer-disclaimer">JARVIS uses the local model you choose. Model responses may be inaccurate.</div></div>
    </main>
    {settingsOpen && <div className="settings-overlay" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setSettingsOpen(false); }}><section className="settings-dialog" role="dialog" aria-modal="true" aria-labelledby="settings-title"><div className="settings-heading"><div><div className="history-label">LOCAL MODEL CONNECTION</div><h2 id="settings-title">Connect your model</h2></div><button className="icon-button" aria-label="Close settings" onClick={() => setSettingsOpen(false)}><X size={17}/></button></div><p className="settings-copy">JARVIS connects directly to Ollama running on this device. No cloud account or API key is used for this connection.</p><label htmlFor="ollama-endpoint">Ollama address</label><input id="ollama-endpoint" value={endpointDraft} onChange={event => setEndpointDraft(event.target.value)} placeholder={DEFAULT_ENDPOINT}/><div className="settings-hint">Default: <code>{DEFAULT_ENDPOINT}</code>. Ollama must allow this website's browser origin.</div><div className="settings-actions"><button className="settings-cancel" onClick={() => setSettingsOpen(false)}>Cancel</button><button className="settings-save" onClick={saveEndpoint}>Save &amp; connect <ArrowUp size={14}/></button></div><a className="ollama-help" href="https://ollama.com/download" target="_blank" rel="noreferrer">Ollama isn't installed? View Ollama's official download page ↗</a></section></div>}
    <div className="assistant-badge"><span/><Check size={11}/> LOCAL-FIRST SESSION</div>
  </div>;
}

