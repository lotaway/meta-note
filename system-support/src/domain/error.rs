use thiserror::Error;

#[derive(Error, Debug)]
pub enum CaptureError {
    #[error("Capture device initialization failed: {0}")]
    DeviceInitializationFailed(String),
    #[error("Capture start failed: {0}")]
    StartFailed(String),
    #[error("Capture stopped unexpectedly: {0}")]
    UnexpectedStop(String),
}

#[derive(Error, Debug)]
pub enum EncodingError {
    #[error("Encoder initialization failed: {0}")]
    InitializationFailed(String),
    #[error("Encoding process failed: {0}")]
    ProcessFailed(String),
}

#[derive(Error, Debug)]
pub enum TransportError {
    #[error("Transport connection failed: {0}")]
    ConnectionFailed(String),
    #[error("Data transmission failed: {0}")]
    TransmissionFailed(String),
}
