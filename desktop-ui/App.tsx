import { useCallback, useEffect, useState } from "react";
import { invoke, isTauri } from "@tauri-apps/api/core";
import { Link, Navigate, Route, Routes } from "react-router-dom";
import { ArrowRight, ArrowUpRight, Check, CircleAlert, Cloud, Cpu, RefreshCw, ShieldCheck } from "lucide-react";
import Chat from "../src/pages/Chat";

const OLLAMA_URL = "http://127.0.0.1:11434";
type Provider = "gemini" | "ollama";
type Connection = "checking" | "connected" | "no-model" | "offline";

function DesktopHome() {
  const [provider, setProvider] = useState<Provider>("gemini");
  const [connection, setConnection] = useState<Connection>("checking");
  const [modelCount, setModelCount] = useState(0);
  const [message, setMessage] = useState("");
  const checkProvider = useCallback(async () => {
    const configured = isTauri() ? localStorage.getItem("jarvis.provider.v1") : null;
    const selected: Provider = configured === "ollama" ? "ollama" : "gemini";
    setProvider(selected); setConnection("checking"); setMessage("");
    if (selected === "gemini") {
      try {
        if (!isTauri()) throw new Error("Open the desktop app to use Gemini.");
        const models = await invoke<{ name: string }[]>("list_gemini_models");
        setModelCount(models.length); setConnection(models.length ? "connected" : "no-model");
        setMessage(models.length ? `Gemini is connected. ${models.length} text model${models.length === 1 ? "" : "s"} available.` : "No Gemini text models are available to this API key.");
      } catch (error) {
        setModelCount(0); setConnection("offline");
        setMessage(typeof error === "string" ? error : error instanceof Error ? error.message : "Add a Gemini API key in chat preferences to connect.");
      }
      return;
    }
    try {
      const configuredEndpoint = localStorage.getItem("jarvis.local-chat.endpoint.v1") || OLLAMA_URL;
      const target = new URL(configuredEndpoint);
      if (!["localhost", "127.0.0.1", "[::1]"].includes(target.hostname) || !["http:", "https:"].includes(target.protocol)) throw new Error();
      const response = await fetch(`${target.origin}/api/tags`, { signal: AbortSignal.timeout(5000), redirect: "error" });
      if (!response.ok) throw new Error();
      const data = await response.json() as { models?: { name: string }[] };
      const count = data.models?.length || 0;
      setModelCount(count); setConnection(count ? "connected" : "no-model");
      setMessage(count ? `${count} local model${count === 1 ? "" : "s"} available. Select one in chat.` : "Ollama is running, but no model is installed. Install one in Ollama, then check again.");
    } catch { setConnection("offline"); setModelCount(0); setMessage("Ollama could not be reached. Start it and allow the desktop WebView origin in OLLAMA_ORIGINS, then restart Ollama."); }
  }, []);
  useEffect(() => { void checkProvider(); }, [checkProvider]);
  const connected = connection === "connected";
  const providerName = provider === "gemini" ? "Gemini" : "Ollama";
  return <div className="desktop-home">
    <header className="desktop-head"><a href="/" className="desktop-brand"><span className="chat-orb-mark"><i/></span> JARVIS <span className="desktop-edition">DESKTOP PREVIEW</span></a><div className="desktop-local-indicator"><i className={connection}/>{connection === "checking" ? `CHECKING ${providerName.toUpperCase()}` : connected ? `${providerName.toUpperCase()} READY` : `${providerName.toUpperCase()} NOT CONNECTED`}</div></header>
    <main className="desktop-content"><div className="desktop-welcome"><div className="desktop-eyebrow"><span/> YOUR ASSISTANT · YOUR PROVIDER</div><h1>Choose your AI.<br/><em>Make it yours.</em></h1><p>Use Gemini with your own API key, or choose an Ollama model running locally. Set your names, appearance, and voice preferences in chat.</p><div className="desktop-actions"><Link className="desktop-primary" to="/chat">Open JARVIS <ArrowRight size={16}/></Link><button className="desktop-secondary" onClick={() => void checkProvider()}><RefreshCw size={14}/> Check provider</button></div></div>
      <section className="desktop-status-card"><div className="desktop-card-label">AI PROVIDER STATUS</div><div className="desktop-status-icon">{connected ? provider === "gemini" ? <Cloud size={18}/> : <Check size={18}/> : connection === "checking" ? <Cpu size={18}/> : <CircleAlert size={18}/>}</div><h2>{connection === "connected" ? `${providerName} is ready` : connection === "no-model" ? `No ${provider === "gemini" ? "Gemini text models" : "local model"} available` : connection === "checking" ? `Checking ${providerName}` : `${providerName} needs setup`}</h2><p>{message || `Checking ${providerName} availability…`}</p><div className="desktop-status-foot"><span><ShieldCheck size={13}/>{provider === "gemini" ? "Cloud · your API key" : "Local · this device"}</span><span>{connected ? `${modelCount} model${modelCount === 1 ? "" : "s"} available` : "Choose setup in chat"}</span></div></section>
      <section className="desktop-next"><div className="desktop-card-label">IN THIS PREVIEW</div><div className="desktop-next-row"><div><b>Available now</b><p>Gemini API and Ollama providers, personalized names, appearance, and optional voice.</p></div><Link to="/chat" aria-label="Open JARVIS chat"><ArrowUpRight size={16}/></Link></div><div className="desktop-next-row future"><div><b>Still in development</b><p>Phone pairing, call/SMS controls, and REA integration.</p></div><span>NOT SHIPPED</span></div></section>
      <a className="desktop-repo" href="https://github.com/ash4jarvis/jarvis" target="_blank" rel="noreferrer">JARVIS source and releases <ArrowUpRight size={13}/></a>
    </main>
    <footer className="desktop-footer">{isTauri() ? "Early desktop app · API keys are stored in the OS credential store" : "Browser preview of the desktop shell"}</footer>
  </div>;
}

export default function DesktopApp() {
  return <Routes><Route path="/" element={<DesktopHome/>}/><Route path="/chat" element={<Chat/>}/><Route path="*" element={<Navigate to="/" replace/>}/></Routes>;
}
