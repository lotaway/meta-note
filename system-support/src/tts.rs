use napi_derive::napi;
use std::process::Command;

#[napi(object)]
#[derive(Clone, serde::Serialize, serde::Deserialize)]
pub struct TTSVoice {
    pub name: String,
    pub language: String,
}

#[napi]
pub fn list_tts_voices() -> Vec<TTSVoice> {
    #[cfg(target_os = "macos")]
    {
        let output = match Command::new("say").arg("-v").arg("?").output() {
            Ok(o) => o,
            Err(_) => return vec![],
        };

        let stdout = String::from_utf8_lossy(&output.stdout);
        let mut voices = Vec::new();

        for line in stdout.lines() {
            let line = line.trim();
            if line.is_empty() {
                continue;
            }
            let parts: Vec<&str> = line.splitn(2, ' ').collect();
            if let Some(name) = parts.first() {
                let name = name.trim_end_matches(' ');
                let lang = parts.get(1).unwrap_or(&"").trim().split(' ').next().unwrap_or("");
                if !name.is_empty() {
                    voices.push(TTSVoice {
                        name: name.to_string(),
                        language: lang.to_string(),
                    });
                }
            }
        }

        return voices;
    }

    #[cfg(target_os = "windows")]
    {
        let script = r#"
Add-Type -AssemblyName System.Speech;
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer;
$synth.GetInstalledVoices() | ForEach-Object {
    $info = $_.VoiceInfo;
    [PSCustomObject]@{ Name = $info.Name; Language = $info.Culture.Name }
} | ConvertTo-Json
"#;

        let output = match Command::new("powershell")
            .args(["-NoProfile", "-Command", script])
            .output()
        {
            Ok(o) => o,
            Err(_) => return vec![],
        };

        let stdout = String::from_utf8_lossy(&output.stdout);
        if let Ok(parsed) = serde_json::from_str::<Vec<TTSVoice>>(&stdout) {
            return parsed;
        }
    }

    Vec::new()
}

#[napi]
pub fn synthesize_speech(text: String, voice: String, output_path: String) -> napi::Result<()> {
    if text.is_empty() {
        return Err(napi::Error::from_reason("Text cannot be empty"));
    }

    synthesize_platform(&text, &voice, &output_path)?;

    // Validate output file exists with content
    if !std::path::Path::new(&output_path).exists() {
        return Err(napi::Error::from_reason(
            "TTS output file was not created",
        ));
    }

    let metadata =
        std::fs::metadata(&output_path).map_err(|e| {
            napi::Error::from_reason(format!("Failed to check output file: {}", e))
        })?;

    if metadata.len() == 0 {
        return Err(napi::Error::from_reason(
            "TTS output file is empty",
        ));
    }

    Ok(())
}

#[cfg(target_os = "macos")]
fn synthesize_platform(text: &str, voice: &str, output_path: &str) -> napi::Result<()> {
    // First verify the voice exists
    let available = list_tts_voices();
    let voice_exists = voice.is_empty()
        || available.iter().any(|v| {
            v.name.eq_ignore_ascii_case(voice)
        });

    let voice_arg = if voice_exists && !voice.is_empty() {
        voice.to_string()
    } else {
        // Use default system voice
        String::from("Samantha")
    };

    let status = Command::new("say")
        .args([
            "-v",
            &voice_arg,
            "-o",
            output_path,
            "--file-format=WAVE",
            "--data-format=LEI16@16000",
        ])
        .arg(text)
        .status()
        .map_err(|e| napi::Error::from_reason(format!("Failed to execute say command: {}", e)))?;

    if !status.success() {
        return Err(napi::Error::from_reason(format!(
            "TTS synthesis failed with exit code: {:?}",
            status.code()
        )));
    }

    Ok(())
}

#[cfg(target_os = "windows")]
fn synthesize_platform(text: &str, voice: &str, output_path: &str) -> napi::Result<()> {
    let escaped_path = output_path.replace('\'', "''");
    let escaped_text = text.replace('\'', "''");

    let script = format!(
        r#"Add-Type -AssemblyName System.Speech;
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer;
try {{
    if ('{voice}' -ne '') {{ $synth.SelectVoice('{voice}') }}
    $synth.SetOutputToWaveFile('{path}');
    $synth.Speak('{text}');
}} finally {{
    $synth.Dispose()
}}"#,
        voice = voice.replace('\'', "''"),
        path = escaped_path,
        text = escaped_text
    );

    let output = Command::new("powershell")
        .args(["-NoProfile", "-Command", &script])
        .output()
        .map_err(|e| {
            napi::Error::from_reason(format!("Failed to execute PowerShell TTS: {}", e))
        })?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(napi::Error::from_reason(format!(
            "Windows TTS failed: {}",
            stderr
        )));
    }

    Ok(())
}

#[cfg(target_os = "linux")]
fn synthesize_platform(text: &str, _voice: &str, output_path: &str) -> napi::Result<()> {
    let status = Command::new("espeak")
        .args(["-w", output_path, text])
        .status()
        .map_err(|e| {
            napi::Error::from_reason(format!("Failed to execute espeak command: {}", e))
        })?;

    if !status.success() {
        return Err(napi::Error::from_reason(format!(
            "Linux TTS (espeak) failed with exit code: {:?}",
            status.code()
        )));
    }

    Ok(())
}
