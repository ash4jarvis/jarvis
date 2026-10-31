import { useCallback, useEffect, useState } from "react";
import { isTauri } from "@tauri-apps/api/core";
import { Link, Navigate, Route, Routes } from "react-router-dom";
import { ArrowRight, ArrowUpRight, Check, CircleAlert, Cpu, RefreshCw, ShieldCheck } from "lucide-react";
import Chat from "../src/pages/Chat";

const OLLAMA_URL = "http://localhost:11434";

type Connection = "checking" | "connected" | "offline";

function DesktopHome() {
  const [connection, setConnection] = useState<Connection>("checking");
  const [modelCount, setModelCount] = useState(0);
  const [message, setMessage] = useState("");
  const checkLocalModel = useCallback(async () => {
    setConnection("checking"); setMessage("");
    try {
      const configured = localStorage.getItem("jarvis.local-chat.endpoint.v1") || OLLAMA_URL;
      const target = new URL(configured);
      if (!["localhost", "127.0.0.1", "[::1]"].includes(target.hostname) || !["http:", "https:"].includes(target.protocol)) throw new Error();
      const response = await fetch(`${target.origin}/api/tags`, { signal: AbortSignal.timeout(5000), redirect: "error" });
      if (!response.ok) throw new Error();
      const data = await response.json() as { models?: { name: string }[] };
      setModelCount(data.models?.length || 0); setConnection("connected");
      setMessage(data.models?.length ? `${data.models.length} local model${data.models.length === 1 ? "" : "s"} available.` : "Ollama is running, but there are no installed models yet.");
    } catch { setConnection("offline"); setModelCount(0); setMessage("Ollama could not be reached. Start Ollama and check its WebView-origin access."); }
  }, []);
  useEffect(() => { void checkLocalModel(); }, [checkLocalModel]);
  return <div className="desktop-home">
    <header className="desktop-head"><a href="/" className="desktop-brand"><span className="chat-orb-mark"><i/></span> JARVIS <span className="desktop-edition">DESKTOP PREVIEW</span></a><div className="desktop-local-indicator"><i className={connection}/>{connection === "connected" ? "LOCAL MODEL READY" : connection === "checking" ? "CHECKING LOCAL MODEL" : "LOCAL MODEL OFFLINE"}</div></header>
    <main className="desktop-content"><div className="desktop-welcome"><div className="desktop-eyebrow"><span/> PRIVATE BY DESIGN · LOCAL FIRST</div><h1>Your workspace,<br/><em>in your orbit.</em></h1><p>This early desktop shell reuses JARVIS's local Ollama chat. Voice, file operations, automation, and native computer controls are not included yet.</p><div className="desktop-actions"><Link className="desktop-primary" to="/chat">Open local chat <ArrowRight size={16}/></Link><button className="desktop-secondary" onClick={() => void checkLocalModel()}><RefreshCw size={14}/> Check model</button></div></div>
      <section className="desktop-status-card"><div className="desktop-card-label">LOCAL MODEL STATUS</div><div className="desktop-status-icon">{connection === "connected" ? <Check size={18}/> : connection === "offline" ? <CircleAlert size={18}/> : <Cpu size={18}/>}</div><h2>{connection === "connected" ? "Ollama connection" : connection === "checking" ? "Checking Ollama" : "Model not connected"}</h2><p>{message || "Connecting to the Ollama service on this device…"}</p><div className="desktop-status-foot"><span><ShieldCheck size={13}/> Local endpoint only</span><span>{connection === "connected" ? `${modelCount} model${modelCount === 1 ? "" : "s"}` : "No model selected"}</span></div></section>
      <section className="desktop-next"><div className="desktop-card-label">IN THIS PREVIEW</div><div className="desktop-next-row"><div><b>Available now</b><p>Ollama text chat with local browser storage.</p></div><Link to="/chat" aria-label="Open local chat"><ArrowUpRight size={16}/></Link></div><div className="desktop-next-row future"><div><b>Still in development</b><p>Native storage, voice, platform actions, and automation.</p></div><span>NOT SHIPPED</span></div></section>
      <a className="desktop-repo" href="https://github.com/ash4jarvis/jarvis" target="_blank" rel="noreferrer">JARVIS source and releases <ArrowUpRight size={13}/></a>
    </main>
    <footer className="desktop-footer">{isTauri() ? "Early cross-platform shell · Unsigned preview builds" : "Browser preview of the desktop shell · Unsigned preview builds"} · Review before using with personal data</footer>
  </div>;
}

export default function DesktopApp() {
  return <Routes><Route path="/" element={<DesktopHome/>}/><Route path="/chat" element={<Chat/>}/><Route path="*" element={<Navigate to="/" replace/>}/></Routes>;
}
