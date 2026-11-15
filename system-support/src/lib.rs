pub mod monitor;
pub mod media;
pub mod audio;
pub mod tts;

use napi_derive::napi;

#[napi]
pub fn init() {
    println!("system-support v0.2.0 initialized");
}
