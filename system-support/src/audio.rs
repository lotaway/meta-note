use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use cpal::{Device, Stream};
use napi_derive::napi;
use once_cell::sync::Lazy;
use std::sync::{Arc, Mutex};

/// cpal::Stream is !Send by design. We know the stream is kept alive
/// for the duration of the static and only accessed from the main thread,
/// so this is safe.
#[allow(dead_code)]
struct SendStream(Stream);
unsafe impl Send for SendStream {}

struct RunningCapture {
    _stream: SendStream,
    buffer: Arc<Mutex<Vec<f32>>>,
    sample_rate: u32,
    channels: u16,
}

static ACTIVE_AUDIO: Lazy<Mutex<Option<RunningCapture>>> = Lazy::new(|| Mutex::new(None));

#[napi(object)]
#[derive(Clone)]
pub struct AudioDevice {
    pub index: i32,
    pub name: String,
}

#[napi(object)]
#[derive(Clone)]
pub struct AudioData {
    pub data: Vec<u8>,
    pub sample_rate: i32,
    pub channels: i32,
}

fn find_device(host: &cpal::Host, index: usize) -> Option<Device> {
    host.devices()
        .ok()?
        .enumerate()
        .filter(|(_, d)| d.name().is_ok())
        .find(|(i, _)| *i == index)
        .map(|(_, d)| d)
}

#[napi]
pub fn list_audio_devices() -> Vec<AudioDevice> {
    let host = match cpal::default_host().devices() {
        Ok(devices) => devices,
        Err(_) => return vec![],
    };

    host.enumerate()
        .filter_map(|(i, d)| {
            d.name().ok().map(|name| AudioDevice {
                index: i as i32,
                name,
            })
        })
        .collect()
}

#[napi]
pub fn start_audio_capture(device_index: i32, sample_rate: i32) -> napi::Result<()> {
    let mut guard = ACTIVE_AUDIO.lock().map_err(|e| {
        napi::Error::from_reason(format!("Lock error: {}", e))
    })?;

    *guard = None;

    let host = cpal::default_host();
    let device = find_device(&host, device_index as usize).ok_or_else(|| {
        napi::Error::from_reason(format!("Audio device {} not found", device_index))
    })?;

    let name = device.name().unwrap_or_default();
    println!("Starting audio capture on: {}", name);

    let config = device
        .default_input_config()
        .map_err(|e| napi::Error::from_reason(format!("No input config: {}", e)))?;

    let sr = if sample_rate > 0 {
        sample_rate as u32
    } else {
        config.sample_rate().0
    };

    let channels = config.channels();
    let buffer: Arc<Mutex<Vec<f32>>> = Arc::new(Mutex::new(Vec::with_capacity(4096)));
    let buf = buffer.clone();

    let stream = device
        .build_input_stream(
            &cpal::StreamConfig {
                channels,
                sample_rate: cpal::SampleRate(sr),
                buffer_size: cpal::BufferSize::Default,
            },
            move |data: &[f32], _: &cpal::InputCallbackInfo| {
                if let Ok(mut b) = buf.lock() {
                    b.extend_from_slice(data);
                    let max_samples = sr as usize * 2;
                    if b.len() > max_samples {
                        let excess = b.len() - max_samples;
                        b.drain(0..excess);
                    }
                }
            },
            move |err| {
                eprintln!("Audio capture error: {}", err);
            },
            None,
        )
        .map_err(|e| napi::Error::from_reason(format!("Failed to build stream: {}", e)))?;

    stream
        .play()
        .map_err(|e| napi::Error::from_reason(format!("Failed to play stream: {}", e)))?;

    *guard = Some(RunningCapture {
        _stream: SendStream(stream),
        buffer,
        sample_rate: sr,
        channels,
    });

    Ok(())
}

#[napi]
pub fn stop_audio_capture() -> bool {
    if let Ok(mut guard) = ACTIVE_AUDIO.lock() {
        if guard.take().is_some() {
            return true;
        }
    }
    false
}

#[napi]
pub fn get_audio_data() -> Option<AudioData> {
    if let Ok(guard) = ACTIVE_AUDIO.lock() {
        if let Some(cap) = guard.as_ref() {
            if let Ok(mut b) = cap.buffer.lock() {
                if b.is_empty() {
                    return None;
                }
                // Convert f32 samples to i16 PCM bytes
                let bytes: Vec<u8> = b
                    .drain(..)
                    .flat_map(|sample| {
                        let clamped = sample.clamp(-1.0, 1.0);
                        let i16_sample = (clamped * i16::MAX as f32) as i16;
                        i16_sample.to_le_bytes()
                    })
                    .collect();
                return Some(AudioData {
                    data: bytes,
                    sample_rate: cap.sample_rate as i32,
                    channels: cap.channels as i32,
                });
            }
        }
    }
    None
}
