pub mod dto;
use crate::api::dto::CaptureOptions;
use napi_derive::napi;

#[napi]
pub fn start_capture_service(options: CaptureOptions) -> String {
    format!(
        "Capture service started: {}x{} at {}fps",
        options.width, options.height, options.fps
    )
}

#[napi]
pub fn stop_capture_service() -> bool {
    true
}
