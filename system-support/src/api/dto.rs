use napi_derive::napi;
use serde::Deserialize;

#[napi(object)]
#[derive(Deserialize)]
pub struct CaptureOptions {
    pub source_type: String,
    pub width: i32,
    pub height: i32,
    pub fps: i32,
}
