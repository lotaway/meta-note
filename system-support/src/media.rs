use napi_derive::napi;
use nokhwa::CallbackCamera;
use nokhwa_core::error::NokhwaError;
use nokhwa_core::types::{
    ApiBackend, CameraFormat, CameraIndex, FrameFormat, RequestedFormat,
    RequestedFormatType, Resolution,
};
use once_cell::sync::Lazy;
use std::sync::{Arc, Mutex};

struct RunningCamera {
    _callback_cam: CallbackCamera,
    latest_frame: Arc<Mutex<Option<Vec<u8>>>>,
    width: u32,
    height: u32,
}

static ACTIVE_CAMERA: Lazy<Mutex<Option<RunningCamera>>> = Lazy::new(|| Mutex::new(None));

#[napi(object)]
#[derive(Clone)]
pub struct CameraDevice {
    pub index: i32,
    pub name: String,
    pub description: String,
}

#[napi(object)]
#[derive(Clone)]
pub struct CapturedFrame {
    pub data: Vec<u8>,
    pub width: i32,
    pub height: i32,
}

#[napi]
pub fn list_cameras() -> Vec<CameraDevice> {
    match nokhwa::query(ApiBackend::Auto) {
        Ok(cameras) => cameras
            .into_iter()
            .enumerate()
            .map(|(i, info)| CameraDevice {
                index: i as i32,
                name: info.human_name().to_string(),
                description: info.description().to_string(),
            })
            .collect(),
        Err(e) => {
            eprintln!("Failed to list cameras: {}", e);
            vec![]
        }
    }
}

#[napi]
pub fn start_camera(index: i32, width: i32, height: i32, fps: i32) -> napi::Result<()> {
    let mut guard = ACTIVE_CAMERA.lock().map_err(|e| {
        napi::Error::from_reason(format!("Lock error: {}", e))
    })?;

    *guard = None;

    let w = std::cmp::max(width as u32, 320);
    let h = std::cmp::max(height as u32, 240);
    let resolution = Resolution::new(w, h);
    let camera_format = CameraFormat::new(resolution, FrameFormat::MJPEG, fps.max(1) as u32);
    let requested = RequestedFormat::new::<nokhwa_core::pixel_format::RgbFormat>(
        RequestedFormatType::Exact(camera_format),
    );

    let actual_resolution = resolution;
    let latest_frame: Arc<Mutex<Option<Vec<u8>>>> = Arc::new(Mutex::new(None));
    let lf = latest_frame.clone();

    let mut callback_cam =
        CallbackCamera::new(CameraIndex::Index(index as u32), requested, move |frame| {
            if let Ok(mut buf) = lf.lock() {
                *buf = Some(frame.buffer().to_vec());
            }
        })
        .map_err(|e: NokhwaError| {
            napi::Error::from_reason(format!("Failed to open camera: {}", e))
        })?;

    callback_cam
        .open_stream()
        .map_err(|e: NokhwaError| {
            napi::Error::from_reason(format!("Failed to start camera stream: {}", e))
        })?;

    *guard = Some(RunningCamera {
        _callback_cam: callback_cam,
        latest_frame,
        width: actual_resolution.width(),
        height: actual_resolution.height(),
    });

    Ok(())
}

#[napi]
pub fn stop_camera() -> bool {
    if let Ok(mut guard) = ACTIVE_CAMERA.lock() {
        if guard.take().is_some() {
            return true;
        }
    }
    false
}

#[napi]
pub fn get_latest_frame() -> Option<CapturedFrame> {
    if let Ok(guard) = ACTIVE_CAMERA.lock() {
        if let Some(cam) = guard.as_ref() {
            if let Ok(mut buf) = cam.latest_frame.lock() {
                if let Some(data) = buf.take() {
                    return Some(CapturedFrame {
                        data,
                        width: cam.width as i32,
                        height: cam.height as i32,
                    });
                }
            }
        }
    }
    None
}
