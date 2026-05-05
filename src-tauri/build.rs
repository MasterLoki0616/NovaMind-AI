use std::env;
use std::fs;
use std::path::{Path, PathBuf};

fn main() {
    println!("cargo:rerun-if-env-changed=OPENAI_API_KEY");

    let manifest_dir = env::var("CARGO_MANIFEST_DIR")
        .map(PathBuf::from)
        .unwrap_or_else(|_| PathBuf::from("."));

    for candidate in candidate_env_paths(&manifest_dir) {
        println!("cargo:rerun-if-changed={}", candidate.display());
    }

    if let Some(api_key) = resolve_protected_openai_key(&manifest_dir) {
        println!("cargo:rustc-env=NOVAMIND_OPENAI_API_KEY={api_key}");
    }

    tauri_build::build()
}

fn resolve_protected_openai_key(manifest_dir: &Path) -> Option<String> {
    if let Ok(api_key) = std::env::var("OPENAI_API_KEY") {
        let trimmed = api_key.trim();
        if !trimmed.is_empty() {
            return Some(trimmed.to_string());
        }
    }

    candidate_env_paths(manifest_dir)
        .into_iter()
        .find_map(|path| load_key_from_env_file(&path))
}

fn candidate_env_paths(manifest_dir: &Path) -> Vec<PathBuf> {
    let mut candidates = vec![manifest_dir.join(".env.local"), manifest_dir.join(".env")];

    if let Some(parent_dir) = manifest_dir.parent() {
        candidates.push(parent_dir.join(".env.local"));
        candidates.push(parent_dir.join(".env"));
    }

    candidates
}

fn load_key_from_env_file(path: &Path) -> Option<String> {
    let content = fs::read_to_string(path).ok()?;

    content.lines().find_map(|line| {
        let trimmed = line.trim();

        if trimmed.is_empty() || trimmed.starts_with('#') {
            return None;
        }

        let (key, value) = trimmed.split_once('=')?;
        if key.trim() != "OPENAI_API_KEY" {
            return None;
        }

        let normalized = value
            .trim()
            .trim_matches('"')
            .trim_matches('\'')
            .trim();

        if normalized.is_empty() {
            None
        } else {
            Some(normalized.to_string())
        }
    })
}
