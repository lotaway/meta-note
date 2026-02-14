use crate::domain::error::TransportError;
use async_trait::async_trait;

#[async_trait]
pub trait MediaTransport: Send + Sync {
    async fn connect(&self, signaling_url: &str) -> Result<(), TransportError>;
    async fn send_packet(&self, packet: &[u8]) -> Result<(), TransportError>;
    fn is_connected(&self) -> bool;
}
