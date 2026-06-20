use std::path::PathBuf;

fn main() {
    // The real `llama-server` sidecar is built from source (per platform) by
    // `scripts/build-llama-server.sh` before a release build. On dev
    // machines and CI where it's absent, create an empty placeholder at the
    // target-triple-suffixed path so `tauri_build` doesn't fail resolving the
    // configured `externalBin`. A real build replaces it with the actual binary.
    ensure_sidecar_placeholder();

    tauri_build::build()
}

fn ensure_sidecar_placeholder() {
    let triple = match std::env::var("TARGET") {
        Ok(t) if !t.is_empty() => t,
        _ => return,
    };
    let name = if triple.contains("windows") {
        format!("llama-server-{triple}.exe")
    } else {
        format!("llama-server-{triple}")
    };
    let path = PathBuf::from("binaries").join(name);
    if path.exists() {
        return;
    }
    if let Some(parent) = path.parent() {
        let _ = std::fs::create_dir_all(parent);
    }
    if std::fs::write(&path, b"").is_ok() {
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            let _ = std::fs::set_permissions(&path, std::fs::Permissions::from_mode(0o755));
        }
    }
}
