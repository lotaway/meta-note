use crate::domain::error::EncodingError;

pub enum VideoCodec {
    H264,
    H265,
    AV1,
}

pub struct EncodingParameters {
    pub codec: VideoCodec,
    pub bitrate_kbps: u32,
    pub gop_size: u32,
}

pub trait MediaEncoder: Send + Sync {
    fn initialize(&self, params: EncodingParameters) -> Result<(), EncodingError>;
    fn encode_frame(&self, frame: &[u8]) -> Result<Vec<u8>, EncodingError>;
    fn is_encoding_active(&self) -> bool;
}
