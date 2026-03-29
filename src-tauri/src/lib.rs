use base64::{engine::general_purpose::STANDARD, Engine as _};
use futures_util::StreamExt;
use image::{DynamicImage, ImageFormat};
use mime_guess::from_path;
use reqwest::multipart::{Form, Part};
use screenshots::Screen;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::fs;
use std::io::Cursor;
use std::path::{Path, PathBuf};
use tauri::Emitter;

const OPENAI_API_BASE: &str = "https://api.openai.com/v1";
const TEXT_PREVIEW_LIMIT: usize = 24_000;
const DOCX_PREVIEW_LIMIT: usize = 12 * 1024 * 1024;
const IGNORED_TERMINAL_DIRS: &[&str] = &[".git", "node_modules", "target", "dist", "dist-server"];

#[derive(Clone, Copy, Debug, Deserialize)]
#[serde(rename_all = "lowercase")]
enum AssistantMode {
    Chat,
    Code,
    Voice,
}

#[derive(Clone, Copy, Deserialize)]
#[serde(rename_all = "lowercase")]
enum SmartCommand {
    Summarize,
    Explain,
    Rewrite,
    Translate,
    Code,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct ChatMessageInput {
    role: String,
    content: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct DesktopChatRequest {
    api_key: String,
    mode: AssistantMode,
    messages: Vec<ChatMessageInput>,
    model: String,
    temperature: f32,
    system_prompt: String,
    command: Option<SmartCommand>,
    web_search: Option<bool>,
    image_data_url: Option<String>,
    input_method: Option<String>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct DesktopChatStreamRequest {
    stream_id: String,
    #[serde(flatten)]
    chat: DesktopChatRequest,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct DesktopScreenRequest {
    api_key: String,
    image_data_url: String,
    prompt: String,
    model: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct DesktopTranscriptionRequest {
    api_key: String,
    audio_base64: String,
    mime_type: String,
    file_name: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct DesktopSpeechRequest {
    api_key: String,
    text: String,
    voice: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct DesktopDocumentSummaryRequest {
    api_key: String,
    file_name: String,
    extracted_text: String,
    model: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct DesktopFilePreviewRequest {
    path: String,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct TerminalFilePayload {
    id: String,
    kind: String,
    name: String,
    size: u64,
    mime_type: String,
    extension: Option<String>,
    path: String,
    origin: String,
    preview_kind: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct DesktopDocumentSummaryResponse {
    summary: String,
    truncated: bool,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct DesktopChatStreamEvent {
    stream_id: String,
    kind: String,
    text: Option<String>,
    message: Option<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct DesktopFilePreviewResponse {
    name: String,
    path: String,
    size: u64,
    mime_type: String,
    preview_kind: String,
    text: Option<String>,
    base64: Option<String>,
    truncated: bool,
}

#[tauri::command]
fn capture_primary_screen() -> Result<String, String> {
    let screens = Screen::all().map_err(|error| error.to_string())?;
    let screen = screens
        .first()
        .ok_or_else(|| String::from("No display detected."))?;

    let image = screen.capture().map_err(|error| error.to_string())?;
    let dynamic_image = DynamicImage::ImageRgba8(image);
    let mut buffer = Cursor::new(Vec::new());

    dynamic_image
        .write_to(&mut buffer, ImageFormat::Png)
        .map_err(|error| error.to_string())?;

    Ok(STANDARD.encode(buffer.into_inner()))
}

#[tauri::command]
async fn desktop_chat_completion(request: DesktopChatRequest) -> Result<String, String> {
    ensure_api_key(&request.api_key)?;

    if request.messages.is_empty() {
        return Err(String::from("Chat history is required."));
    }

    let client = openai_client()?;
    let mut messages = vec![json!({
        "role": "system",
        "content": build_system_prompt(request.mode, request.command, &request.system_prompt)
    })];
    let last_index = request.messages.len().saturating_sub(1);

    messages.extend(request.messages.into_iter().enumerate().map(|(index, message)| {
        if let Some(image_data_url) = request.image_data_url.as_ref() {
            if index == last_index && message.role == "user" && !image_data_url.trim().is_empty() {
                return json!({
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": format!(
                                "The latest shared screen image is attached to this message. Analyze what is visible on the screen directly before answering.\n\nUser question:\n{}",
                                message.content
                            )
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": image_data_url,
                                "detail": "high"
                            }
                        }
                    ]
                });
            }
        }

        json!({ "role": message.role, "content": message.content })
    }));

    let payload = json!({
        "model": request.model,
        "temperature": request.temperature,
        "messages": messages
    });

    let response = send_chat_completion_request(
        &client,
        &request.api_key,
        payload,
        request.web_search.unwrap_or(false) && request.image_data_url.as_ref().map(|value| value.trim().is_empty()).unwrap_or(true),
    )
    .await?;

    let json = parse_openai_json(response).await?;
    extract_message_text(&json)
        .ok_or_else(|| String::from("NovaMind returned an empty response."))
}

#[tauri::command]
async fn desktop_chat_stream(
    app: tauri::AppHandle,
    request: DesktopChatStreamRequest,
) -> Result<(), String> {
    ensure_api_key(&request.chat.api_key)?;

    if request.chat.messages.is_empty() {
        return Err(String::from("Chat history is required."));
    }

    println!(
        "[NovaMind][desktop_chat_stream] input_method={} has_screen_context={} mode={:?} message_count={}",
        request
            .chat
            .input_method
            .clone()
            .unwrap_or_else(|| String::from("unknown")),
        request
            .chat
            .image_data_url
            .as_ref()
            .map(|value| !value.trim().is_empty())
            .unwrap_or(false),
        request.chat.mode,
        request.chat.messages.len()
    );

    let client = openai_client()?;
    let mut messages = vec![json!({
        "role": "system",
        "content": build_system_prompt(
            request.chat.mode,
            request.chat.command,
            &request.chat.system_prompt,
        )
    })];
    let last_index = request.chat.messages.len().saturating_sub(1);

    messages.extend(
        request
            .chat
            .messages
            .into_iter()
            .enumerate()
            .map(|(index, message)| {
                if let Some(image_data_url) = request.chat.image_data_url.as_ref() {
                    if index == last_index
                        && message.role == "user"
                        && !image_data_url.trim().is_empty()
                    {
                        return json!({
                            "role": "user",
                            "content": [
                                {
                                    "type": "text",
                                    "text": format!(
                                        "The latest shared screen image is attached to this message. Analyze what is visible on the screen directly before answering.\n\nUser question:\n{}",
                                        message.content
                                    )
                                },
                                {
                                    "type": "image_url",
                                    "image_url": {
                                        "url": image_data_url,
                                        "detail": "high"
                                    }
                                }
                            ]
                        });
                    }
                }

                json!({ "role": message.role, "content": message.content })
            }),
    );

    let payload = json!({
        "model": request.chat.model,
        "temperature": request.chat.temperature,
        "messages": messages,
        "stream": true
    });

    let response = send_chat_completion_request(
        &client,
        &request.chat.api_key,
        payload,
        request.chat.web_search.unwrap_or(false)
            && request
                .chat
                .image_data_url
                .as_ref()
                .map(|value| value.trim().is_empty())
                .unwrap_or(true),
    )
    .await?;

    let stream_id = request.stream_id.clone();
    tauri::async_runtime::spawn(async move {
        let mut buffer = String::new();
        let mut stream = response.bytes_stream();

        while let Some(item) = stream.next().await {
            match item {
                Ok(bytes) => {
                    buffer.push_str(&String::from_utf8_lossy(&bytes));

                    while let Some(index) = buffer.find("\n\n") {
                        let chunk = buffer[..index].to_string();
                        buffer = buffer[index + 2..].to_string();

                        for line in chunk.lines().map(str::trim).filter(|line| !line.is_empty()) {
                            if !line.starts_with("data:") {
                                continue;
                            }

                            let payload = line.trim_start_matches("data:").trim();
                            if payload == "[DONE]" {
                                let _ = app.emit(
                                    "desktop-chat-stream",
                                    DesktopChatStreamEvent {
                                        stream_id: stream_id.clone(),
                                        kind: String::from("done"),
                                        text: None,
                                        message: None,
                                    },
                                );
                                return;
                            }

                            match serde_json::from_str::<Value>(payload) {
                                Ok(json) => {
                                    let delta = json
                                        .get("choices")
                                        .and_then(Value::as_array)
                                        .and_then(|choices| choices.first())
                                        .and_then(|choice| choice.get("delta"))
                                        .and_then(|delta| delta.get("content"))
                                        .and_then(Value::as_str)
                                        .unwrap_or("");

                                    if !delta.is_empty() {
                                        let _ = app.emit(
                                            "desktop-chat-stream",
                                            DesktopChatStreamEvent {
                                                stream_id: stream_id.clone(),
                                                kind: String::from("delta"),
                                                text: Some(delta.to_string()),
                                                message: None,
                                            },
                                        );
                                    }
                                }
                                Err(error) => {
                                    let _ = app.emit(
                                        "desktop-chat-stream",
                                        DesktopChatStreamEvent {
                                            stream_id: stream_id.clone(),
                                            kind: String::from("error"),
                                            text: None,
                                            message: Some(format!(
                                                "Failed to parse a streamed response chunk: {error}"
                                            )),
                                        },
                                    );
                                    return;
                                }
                            }
                        }
                    }
                }
                Err(error) => {
                    let _ = app.emit(
                        "desktop-chat-stream",
                        DesktopChatStreamEvent {
                            stream_id: stream_id.clone(),
                            kind: String::from("error"),
                            text: None,
                            message: Some(format!("Stream failed: {error}")),
                        },
                    );
                    return;
                }
            }
        }

        let _ = app.emit(
            "desktop-chat-stream",
            DesktopChatStreamEvent {
                stream_id,
                kind: String::from("done"),
                text: None,
                message: None,
            },
        );
    });

    Ok(())
}

#[tauri::command]
async fn desktop_analyze_screen(request: DesktopScreenRequest) -> Result<String, String> {
    ensure_api_key(&request.api_key)?;

    if request.image_data_url.trim().is_empty() {
        return Err(String::from("A captured screen image is required."));
    }

    let client = openai_client()?;
    let payload = json!({
        "model": request.model,
        "messages": [
            {
                "role": "system",
                "content": "You are NovaMind AI screen reader mode. Describe relevant UI, text, code, or equations and solve the user's task when possible."
            },
            {
                "role": "user",
                "content": [
                    { "type": "text", "text": request.prompt },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": request.image_data_url,
                            "detail": "high"
                        }
                    }
                ]
            }
        ]
    });

    let response = client
        .post(format!("{OPENAI_API_BASE}/chat/completions"))
        .bearer_auth(request.api_key)
        .json(&payload)
        .send()
        .await
        .map_err(humanize_transport_error)?;

    let json = parse_openai_json(response).await?;
    extract_message_text(&json)
        .ok_or_else(|| String::from("NovaMind returned an empty screen analysis."))
}

#[tauri::command]
async fn desktop_transcribe_audio(request: DesktopTranscriptionRequest) -> Result<String, String> {
    ensure_api_key(&request.api_key)?;

    let audio_bytes = STANDARD
        .decode(request.audio_base64.as_bytes())
        .map_err(|_| String::from("Failed to decode the recorded audio."))?;
    let file_name = request.file_name.clone();
    let audio_part = Part::bytes(audio_bytes.clone())
        .file_name(file_name.clone())
        .mime_str(&request.mime_type)
        .unwrap_or_else(|_| Part::bytes(audio_bytes).file_name(file_name));

    let response = openai_client()?
        .post(format!("{OPENAI_API_BASE}/audio/transcriptions"))
        .bearer_auth(request.api_key)
        .multipart(
            Form::new()
                .part("file", audio_part)
                .text("model", String::from("whisper-1")),
        )
        .send()
        .await
        .map_err(humanize_transport_error)?;

    let json = parse_openai_json(response).await?;
    json.get("text")
        .and_then(Value::as_str)
        .map(|text| text.to_string())
        .filter(|text| !text.trim().is_empty())
        .ok_or_else(|| String::from("Transcription returned no text."))
}

#[tauri::command]
async fn desktop_text_to_speech(request: DesktopSpeechRequest) -> Result<String, String> {
    ensure_api_key(&request.api_key)?;

    if request.text.trim().is_empty() {
        return Err(String::from("Text is required."));
    }

    let response = openai_client()?
        .post(format!("{OPENAI_API_BASE}/audio/speech"))
        .bearer_auth(request.api_key)
        .json(&json!({
            "model": "tts-1",
            "voice": request.voice,
            "input": request.text.chars().take(4000).collect::<String>()
        }))
        .send()
        .await
        .map_err(humanize_transport_error)?;

    if !response.status().is_success() {
        return Err(extract_openai_error(response).await);
    }

    let bytes = response
        .bytes()
        .await
        .map_err(|error| format!("Failed to read speech audio: {error}"))?;

    Ok(STANDARD.encode(bytes))
}

#[tauri::command]
async fn desktop_summarize_document(
    request: DesktopDocumentSummaryRequest,
) -> Result<DesktopDocumentSummaryResponse, String> {
    ensure_api_key(&request.api_key)?;

    if request.extracted_text.trim().is_empty() {
        return Err(String::from("This file did not contain readable text."));
    }

    let (context, truncated) = truncate_document_context(&request.extracted_text, 18_000);
    let payload = json!({
        "model": request.model,
        "messages": [
            {
                "role": "system",
                "content": "Summarize uploaded documents for a knowledge worker. Return a short summary followed by bullet-style key points and notable actions or risks."
            },
            {
                "role": "user",
                "content": format!("Document name: {}\n\n{}", request.file_name, context)
            }
        ]
    });

    let response = openai_client()?
        .post(format!("{OPENAI_API_BASE}/chat/completions"))
        .bearer_auth(request.api_key)
        .json(&payload)
        .send()
        .await
        .map_err(humanize_transport_error)?;

    let json = parse_openai_json(response).await?;
    let summary = extract_message_text(&json)
        .ok_or_else(|| String::from("NovaMind returned an empty document summary."))?;

    Ok(DesktopDocumentSummaryResponse { summary, truncated })
}

#[tauri::command]
fn desktop_prepare_file_preview(
    request: DesktopFilePreviewRequest,
) -> Result<DesktopFilePreviewResponse, String> {
    let path = PathBuf::from(request.path);
    let payload = create_terminal_file_payload(&path)
        .ok_or_else(|| String::from("This file cannot be previewed here."))?;
    let preview_kind = payload.preview_kind.clone();
    let (text, base64, truncated) = match preview_kind.as_str() {
        "text" | "code" => {
            let bytes = fs::read(&path)
                .map_err(|error| format!("Failed to read the file preview: {error}"))?;
            let (text, truncated) = bytes_to_preview_text(&bytes, TEXT_PREVIEW_LIMIT);
            (Some(text), None, truncated)
        }
        "docx" => {
            let bytes = fs::read(&path)
                .map_err(|error| format!("Failed to read the file preview: {error}"))?;
            if bytes.len() > DOCX_PREVIEW_LIMIT {
                return Err(String::from("This DOCX file is too large to preview inside NovaMind."));
            }

            (None, Some(STANDARD.encode(bytes)), false)
        }
        _ => (None, None, false),
    };

    Ok(DesktopFilePreviewResponse {
        name: payload.name,
        path: payload.path,
        size: payload.size,
        mime_type: payload.mime_type,
        preview_kind,
        text,
        base64,
        truncated,
    })
}

fn ensure_api_key(api_key: &str) -> Result<(), String> {
    if api_key.trim().is_empty() {
        return Err(String::from(
            "Add your OpenAI API key in Settings to use the desktop app.",
        ));
    }

    Ok(())
}

fn openai_client() -> Result<reqwest::Client, String> {
    reqwest::Client::builder()
        .build()
        .map_err(|error| format!("Failed to create the OpenAI client: {error}"))
}

fn should_retry_without_web_search(message: &str) -> bool {
    let lower = message.to_lowercase();

    lower.contains("web search")
        || lower.contains("web_search")
        || lower.contains("unsupported")
        || lower.contains("not supported")
        || lower.contains("does not support")
}

async fn send_chat_completion_request(
    client: &reqwest::Client,
    api_key: &str,
    payload: Value,
    web_search: bool,
) -> Result<reqwest::Response, String> {
    let mut payload_with_tools = payload.clone();

    if web_search {
        if let Some(object) = payload_with_tools.as_object_mut() {
            object.insert(
                String::from("web_search_options"),
                json!({
                    "search_context_size": "high"
                }),
            );
        }
    }

    let response = client
        .post(format!("{OPENAI_API_BASE}/chat/completions"))
        .bearer_auth(api_key)
        .json(if web_search { &payload_with_tools } else { &payload })
        .send()
        .await
        .map_err(humanize_transport_error)?;

    if !response.status().is_success() && web_search {
        let message = extract_openai_error(response).await;
        if should_retry_without_web_search(&message) {
            return client
                .post(format!("{OPENAI_API_BASE}/chat/completions"))
                .bearer_auth(api_key)
                .json(&payload)
                .send()
                .await
                .map_err(humanize_transport_error);
        }

        return Err(message);
    }

    Ok(response)
}

fn humanize_transport_error(error: reqwest::Error) -> String {
    if error.is_timeout() {
        return String::from("The request timed out. Please try again.");
    }

    if error.is_connect() {
        return String::from("NovaMind could not reach the network. Check your connection and try again.");
    }

    format!("Request failed: {error}")
}

async fn parse_openai_json(response: reqwest::Response) -> Result<Value, String> {
    if !response.status().is_success() {
        return Err(extract_openai_error(response).await);
    }

    response
        .json::<Value>()
        .await
        .map_err(|error| format!("Failed to parse the OpenAI response: {error}"))
}

async fn extract_openai_error(response: reqwest::Response) -> String {
    let status = response.status();
    let fallback = format!("OpenAI request failed with status {status}.");
    let body = response.text().await.unwrap_or_default();

    if body.trim().is_empty() {
        return fallback;
    }

    serde_json::from_str::<Value>(&body)
        .ok()
        .and_then(|json| {
            json.get("error")
                .and_then(|error| error.get("message"))
                .and_then(Value::as_str)
                .map(|message| message.to_string())
        })
        .unwrap_or(fallback)
}

fn extract_message_text(payload: &Value) -> Option<String> {
    if let Some(content) = payload
        .get("choices")
        .and_then(|choices| choices.get(0))
        .and_then(|choice| choice.get("message"))
        .and_then(|message| message.get("content"))
        .and_then(Value::as_str)
    {
        return Some(content.trim().to_string()).filter(|text| !text.is_empty());
    }

    let parts = payload
        .get("choices")
        .and_then(|choices| choices.get(0))
        .and_then(|choice| choice.get("message"))
        .and_then(|message| message.get("content"))
        .and_then(Value::as_array)?
        .iter()
        .filter_map(|item| {
            item.get("text")
                .and_then(Value::as_str)
                .or_else(|| {
                    item.get("text")
                        .and_then(|text| text.get("value"))
                        .and_then(Value::as_str)
                })
                .map(|text| text.trim().to_string())
                .filter(|text| !text.is_empty())
        })
        .collect::<Vec<_>>();

    if parts.is_empty() {
        None
    } else {
        Some(parts.join("\n\n"))
    }
}

fn truncate_document_context(text: &str, limit: usize) -> (String, bool) {
    let char_count = text.chars().count();
    if char_count <= limit {
        return (text.to_string(), false);
    }

    let truncated = text.chars().take(limit).collect::<String>();
    (
        format!("{truncated}\n\n[Document truncated for desktop context window]"),
        true,
    )
}

fn create_terminal_file_payload(path: &Path) -> Option<TerminalFilePayload> {
    if !path.exists() || !path.is_file() || should_ignore_terminal_path(path) {
        return None;
    }

    let extension = path
        .extension()
        .and_then(|value| value.to_str())
        .map(|value| value.to_lowercase());
    let preview_kind = preview_kind_for_extension(extension.as_deref())?;
    let metadata = fs::metadata(path).ok()?;
    let mime_type = from_path(path)
        .first_or_octet_stream()
        .essence_str()
        .to_string();
    let attachment_kind = attachment_kind_for_preview(preview_kind);
    let canonical_path = path.canonicalize().unwrap_or_else(|_| path.to_path_buf());
    let path_string = canonical_path.to_string_lossy().to_string();

    Some(TerminalFilePayload {
        id: path_string.clone(),
        kind: attachment_kind.to_string(),
        name: path.file_name()?.to_string_lossy().to_string(),
        size: metadata.len(),
        mime_type,
        extension,
        path: path_string,
        origin: String::from("terminal"),
        preview_kind: preview_kind.to_string(),
    })
}

fn preview_kind_for_extension(extension: Option<&str>) -> Option<&'static str> {
    match extension? {
        "txt" | "md" | "json" | "csv" => Some("text"),
        "js" | "ts" | "py" | "html" | "css" => Some("code"),
        "png" | "jpg" | "jpeg" => Some("image"),
        "mp4" => Some("video"),
        "pdf" => Some("pdf"),
        "docx" => Some("docx"),
        _ => None,
    }
}

fn attachment_kind_for_preview(preview_kind: &str) -> &'static str {
    match preview_kind {
        "image" => "image",
        "video" => "video",
        "pdf" => "pdf",
        "text" => "text",
        "code" => "code",
        "docx" => "document",
        _ => "file",
    }
}

fn should_ignore_terminal_path(path: &Path) -> bool {
    path.components().any(|component| {
        let value = component.as_os_str().to_string_lossy();
        IGNORED_TERMINAL_DIRS
            .iter()
            .any(|ignored| ignored.eq_ignore_ascii_case(&value))
    })
}

fn bytes_to_preview_text(bytes: &[u8], limit: usize) -> (String, bool) {
    let content = String::from_utf8_lossy(bytes);
    let char_count = content.chars().count();
    if char_count <= limit {
        return (content.to_string(), false);
    }

    let truncated = content.chars().take(limit).collect::<String>();
    (
        format!("{truncated}\n\n[Preview truncated inside NovaMind]"),
        true,
    )
}

fn build_system_prompt(
    mode: AssistantMode,
    command: Option<SmartCommand>,
    user_system_prompt: &str,
) -> String {
    let mode_prompt = match mode {
        AssistantMode::Chat => {
            "You are NovaMind AI, a polished desktop second-brain assistant. Be concise, helpful, and practical."
        }
        AssistantMode::Code => {
            "You are NovaMind AI in code-assistant mode. Optimize for correctness, debugging clarity, and maintainable code."
        }
        AssistantMode::Voice => {
            "You are NovaMind AI in voice mode. Speak naturally, remember the ongoing conversation, avoid making the user repeat themselves, and keep answers concise but complete enough to feel human in a live back-and-forth. When the request depends on current technical facts, documentation, research, or literature, prefer grounded web-backed answers when tools are available."
        }
    };

    let mut parts = vec![
        mode_prompt.to_string(),
        String::from("Tagline: Your Second Brain."),
        String::from(
            "If the user provides incomplete context, ask at most one targeted clarification question; otherwise make reasonable assumptions and move forward.",
        ),
    ];

    if let Some(command_prompt) = command.map(command_prompt) {
        parts.push(command_prompt.to_string());
    }

    if !user_system_prompt.trim().is_empty() {
        parts.push(format!("User preference: {}", user_system_prompt.trim()));
    }

    parts.join("\n\n")
}

fn command_prompt(command: SmartCommand) -> &'static str {
    match command {
        SmartCommand::Summarize => {
            "Focus on concise synthesis. Return the main idea, essential details, and a short action list when useful."
        }
        SmartCommand::Explain => {
            "Explain clearly from first principles. Use examples where they improve understanding and avoid jargon unless required."
        }
        SmartCommand::Rewrite => {
            "Rewrite for clarity, tone, and structure while preserving the original meaning unless the user asks for stronger edits."
        }
        SmartCommand::Translate => {
            "Translate accurately, preserve formatting, and call out ambiguous phrasing when needed. Default to English if the target language is not specified."
        }
        SmartCommand::Code => {
            "Behave like a senior software engineer. Prefer correct, runnable code and explain tradeoffs briefly."
        }
    }
}

pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            capture_primary_screen,
            desktop_chat_completion,
            desktop_chat_stream,
            desktop_analyze_screen,
            desktop_transcribe_audio,
            desktop_text_to_speech,
            desktop_summarize_document,
            desktop_prepare_file_preview
        ])
        .run(tauri::generate_context!())
        .expect("error while running NovaMind AI");
}
