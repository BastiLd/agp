// Fensteranwendung. Die eigentliche Arbeit macht der Python-Kern, der hier als
// Unterprozess laeuft und ueber JSON-Zeilen angesprochen wird.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::io::{BufRead, BufReader, Write};
use std::path::PathBuf;
use std::process::{Child, ChildStdin, Command, Stdio};
use std::sync::Mutex;

use tauri::{AppHandle, Emitter, Manager, State};

#[cfg(windows)]
use std::os::windows::process::CommandExt;
#[cfg(windows)]
const OHNE_KONSOLENFENSTER: u32 = 0x0800_0000;

struct Kern {
    eingabe: Mutex<Option<ChildStdin>>,
    prozess: Mutex<Option<Child>>,
}

/// Sucht den Python-Kern: erst neben der Anwendung, dann die Entwicklungsumgebung.
fn kern_befehl() -> Result<Command, String> {
    if let Ok(pfad) = std::env::var("MITTELKAP_KERN") {
        let mut befehl = Command::new(pfad);
        befehl.arg("--rpc");
        return Ok(befehl);
    }

    // Portable Auslieferung: eigene Python-Umgebung und Kern liegen neben der .exe.
    if let Some(ordner) = std::env::current_exe().ok().and_then(|p| p.parent().map(PathBuf::from)) {
        let eigenstaendig = ordner.join("mittelkap-kern.exe");
        if eigenstaendig.exists() {
            let mut befehl = Command::new(eigenstaendig);
            befehl.arg("--rpc");
            return Ok(befehl);
        }

        let python = ordner.join("mittelkap-daten/runtime/Scripts/python.exe");
        let kern = ordner.join("core");
        if python.exists() && kern.exists() {
            let mut befehl = Command::new(python);
            befehl.args(["-m", "mittelkap.rpc"]).current_dir(&kern);
            return Ok(befehl);
        }
        // Ordner liegt da, aber die Einrichtung fehlt noch.
        if kern.exists() {
            return Err("Die Einrichtung fehlt noch. Bitte einmal ZUERST-EINRICHTEN.bat \
                        ausfuehren, dann die Anwendung neu starten."
                .to_string());
        }
    }

    // Entwicklung: gui/src-tauri/target/<profil>/ -> zurueck zur Projektwurzel.
    let wurzel: PathBuf = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .and_then(|p| p.parent())
        .ok_or("Projektwurzel nicht gefunden")?
        .to_path_buf();
    let python = wurzel.join(".venv/Scripts/python.exe");
    if !python.exists() {
        return Err(format!(
            "Kein Kern gefunden. Erwartet neben der Anwendung 'mittelkap-kern.exe' \
             oder zur Entwicklung {}",
            python.display()
        ));
    }
    let mut befehl = Command::new(python);
    befehl.args(["-m", "mittelkap.rpc"]).current_dir(wurzel.join("core"));
    Ok(befehl)
}

fn kern_starten(app: &AppHandle) -> Result<(), String> {
    let mut befehl = kern_befehl()?;
    befehl
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::null())
        .env("PYTHONIOENCODING", "utf-8")
        .env("PYTHONUNBUFFERED", "1");

    #[cfg(windows)]
    befehl.creation_flags(OHNE_KONSOLENFENSTER);

    let mut kind = befehl
        .spawn()
        .map_err(|e| format!("Kern liess sich nicht starten: {e}"))?;

    let ausgabe = kind.stdout.take().ok_or("Keine Ausgabe vom Kern")?;
    let eingabe = kind.stdin.take().ok_or("Keine Eingabe zum Kern")?;

    let melder = app.clone();
    std::thread::spawn(move || {
        for zeile in BufReader::new(ausgabe).lines().map_while(Result::ok) {
            if let Ok(wert) = serde_json::from_str::<serde_json::Value>(&zeile) {
                let _ = melder.emit("kern", wert);
            }
        }
        let _ = melder.emit("kern", serde_json::json!({ "art": "beendet" }));
    });

    let zustand: State<Kern> = app.state();
    *zustand.eingabe.lock().unwrap() = Some(eingabe);
    *zustand.prozess.lock().unwrap() = Some(kind);
    Ok(())
}

#[tauri::command]
fn auftrag(zustand: State<Kern>, zeile: String) -> Result<(), String> {
    let mut halter = zustand.eingabe.lock().unwrap();
    let eingabe = halter.as_mut().ok_or("Der Kern laeuft nicht.")?;
    writeln!(eingabe, "{zeile}").map_err(|e| format!("Auftrag nicht zustellbar: {e}"))?;
    eingabe.flush().map_err(|e| e.to_string())
}

#[tauri::command]
fn neu_starten(app: AppHandle, zustand: State<Kern>) -> Result<(), String> {
    if let Some(mut alt) = zustand.prozess.lock().unwrap().take() {
        let _ = alt.kill();
    }
    *zustand.eingabe.lock().unwrap() = None;
    kern_starten(&app)
}

fn main() {
    tauri::Builder::default()
        // Zweitstart holt nur das vorhandene Fenster nach vorn: zwei Kerne wuerden
        // sich sonst um die 8 GB Grafikspeicher streiten.
        .plugin(tauri_plugin_single_instance::init(|app, _argumente, _ordner| {
            if let Some(fenster) = app.get_webview_window("main") {
                let _ = fenster.unminimize();
                let _ = fenster.show();
                let _ = fenster.set_focus();
            }
        }))
        .plugin(tauri_plugin_dialog::init())
        .manage(Kern {
            eingabe: Mutex::new(None),
            prozess: Mutex::new(None),
        })
        .invoke_handler(tauri::generate_handler![auftrag, neu_starten])
        .setup(|app| {
            if let Err(fehler) = kern_starten(app.handle()) {
                let _ = app.handle().emit(
                    "kern",
                    serde_json::json!({ "art": "fehler", "text": fehler }),
                );
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("Anwendung konnte nicht gestartet werden");
}
