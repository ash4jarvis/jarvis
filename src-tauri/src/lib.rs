use keyring::Entry;
use serde::Deserialize;
use serde_json::{json, Value};
use std::time::Duration;

const GEMINI_SERVICE: &str = "app.jarvis.desktop";
const GEMINI_ACCOUNT: &str = "gemini-api-key";
const GEMINI_API: &str = "https://generativelanguage.googleapis.com/v1beta";

fn gemini_credential() -> Result<Entry, String> {
    Entry::new(GEMINI_SERVICE, GEMINI_ACCOUNT).map_err(|_| "The operating system credential store is unavailable.".to_string())
}

fn read_gemini_key() -> Result<String, String> {
    gemini_credential()?.get_password().map_err(|_| "Add a Gemini API key in Preferences to use Gemini.".to_string())
}

#[tauri::command]
fn save_gemini_api_key(api_key: String) -> Result<(), String> {
    let cleaned = api_key.trim();
    if cleaned.is_empty() || cleaned.len() > 4096 {
        return Err("Enter a valid Gemini API key.".to_string());
    }
    gemini_credential()?.set_password(cleaned).map_err(|_| "JARVIS could not save the key to the operating system credential store.".to_string())
}

#[tauri::command]
fn has_gemini_api_key() -> bool {
    gemini_credential().and_then(|entry| entry.get_password().map_err(|_| "missing".to_string())).is_ok()
}

#[tauri::command]
fn delete_gemini_api_key() -> Result<(), String> {
    let entry = gemini_credential()?;
    match entry.delete_credential() {
        Ok(()) => Ok(()),
        Err(keyring::Error::NoEntry) => Ok(()),
        Err(_) => Err("JARVIS could not remove the key from the operating system credential store.".to_string()),
    }
}

#[derive(Deserialize)]
struct GeminiModel {
    name: String,
    #[serde(rename = "displayName")]
    display_name: Option<String>,
    #[serde(rename = "supportedGenerationMethods", default)]
    supported_generation_methods: Vec<String>,
}

#[derive(serde::Serialize)]
struct GeminiModelOption {
    name: String,
    #[serde(rename = "displayName")]
    display_name: Option<String>,
}

#[tauri::command]
async fn list_gemini_models() -> Result<Vec<GeminiModelOption>, String> {
    let api_key = read_gemini_key()?;
    let client = reqwest::Client::builder().timeout(Duration::from_secs(30)).build().map_err(|_| "Could not create a secure Gemini connection.".to_string())?;
    let response = client.get(format!("{GEMINI_API}/models")).header("x-goog-api-key", api_key).send().await.map_err(|_| "Could not reach Gemini. Check your internet connection and API key.".to_string())?;
    let status = response.status();
    let body: Value = response.json().await.map_err(|_| "Gemini returned an unreadable response.".to_string())?;
    if !status.is_success() {
        return Err(body.pointer("/error/message").and_then(Value::as_str).unwrap_or("Gemini rejected the request. Check your API key and project access.").to_string());
    }
    let parsed: serde_json::Result<serde_json::Value> = serde_json::from_value(body);
    let data = parsed.map_err(|_| "Gemini returned an invalid model list.".to_string())?;
    let models: Vec<GeminiModel> = serde_json::from_value(data.get("models").cloned().unwrap_or_else(|| json!([]))).map_err(|_| "Gemini returned an invalid model list.".to_string())?;
    let mut result: Vec<GeminiModelOption> = models.into_iter().filter(|model| model.supported_generation_methods.iter().any(|method| method == "generateContent")).filter_map(|model| {
        let name = model.name.strip_prefix("models/")?.to_string();
        if name.is_empty() || !name.chars().all(|character| character.is_ascii_alphanumeric() || matches!(character, '-' | '_' | '.' | ':')) { return None; }
        Some(GeminiModelOption { name, display_name: model.display_name })
    }).collect();
    result.sort_by(|left, right| left.name.cmp(&right.name));
    if result.is_empty() { return Err("No Gemini models with text generation are available to this API key.".to_string()); }
    Ok(result)
}

#[derive(Deserialize)]
struct ChatMessage {
    role: String,
    content: String,
}

#[tauri::command]
async fn generate_gemini_response(model: String, messages: Vec<ChatMessage>, system_instruction: String) -> Result<String, String> {
    let api_key = read_gemini_key()?;
    let model = model.trim();
    if model.is_empty() || !model.chars().all(|character| character.is_ascii_alphanumeric() || matches!(character, '-' | '_' | '.' | ':')) {
        return Err("Select a valid Gemini model.".to_string());
    }
    if messages.is_empty() || messages.len() > 100 {
        return Err("This conversation is too long to send. Start a new conversation and try again.".to_string());
    }
    let contents: Vec<Value> = messages.into_iter().filter(|message| matches!(message.role.as_str(), "user" | "assistant")).map(|message| {
        json!({ "role": if message.role == "assistant" { "model" } else { "user" }, "parts": [{ "text": message.content }] })
    }).collect();
    let system_text = system_instruction.trim();
    let mut request = json!({ "contents": contents });
    if !system_text.is_empty() { request["systemInstruction"] = json!({ "parts": [{ "text": system_text }] }); }
    let client = reqwest::Client::builder().timeout(Duration::from_secs(120)).build().map_err(|_| "Could not create a secure Gemini connection.".to_string())?;
    let response = client.post(format!("{GEMINI_API}/models/{model}:generateContent")).header("x-goog-api-key", api_key).json(&request).send().await.map_err(|_| "Could not reach Gemini. Check your internet connection.".to_string())?;
    let status = response.status();
    let body: Value = response.json().await.map_err(|_| "Gemini returned an unreadable response.".to_string())?;
    if !status.is_success() {
        return Err(body.pointer("/error/message").and_then(Value::as_str).unwrap_or("Gemini rejected this request. Check API access, billing, and the selected model.").to_string());
    }
    let text = body.pointer("/candidates/0/content/parts").and_then(Value::as_array).map(|parts| parts.iter().filter_map(|part| part.get("text").and_then(Value::as_str)).collect::<Vec<_>>().join("")).unwrap_or_default();
    if text.trim().is_empty() { return Err("Gemini returned no text. Try again or select another model.".to_string()); }
    Ok(text)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![save_gemini_api_key, has_gemini_api_key, delete_gemini_api_key, list_gemini_models, generate_gemini_response])
        .run(tauri::generate_context!())
        .expect("failed to start JARVIS");
}
