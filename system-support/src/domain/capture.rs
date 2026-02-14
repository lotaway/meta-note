use crate::domain::error::CaptureError;

pub enum CaptureSource {
    Desktop,
    Camera,
    Window(String),
}

pub struct CaptureConfig {
    pub width: u32,
    pub height: u32,
    pub framerate: u32,
}

pub trait MediaCapture: Send + Sync {
    fn initialize(&self, source: CaptureSource, config: CaptureConfig) -> Result<(), CaptureError>;
    fn start_capture(&self) -> Result<(), CaptureError>;
    fn stop_capture(&self) -> Result<(), CaptureError>;
    fn is_capturing(&self) -> bool;
}

pub struct AudioConfig {
    pub sample_rate: u32,
    pub channels: u16,
}

pub trait AudioCapture: Send + Sync {
    fn initialize_audio(&self, config: AudioConfig) -> Result<(), CaptureError>;
    fn start_audio_capture(&self) -> Result<(), CaptureError>;
    fn is_audio_capturing(&self) -> bool;
}
