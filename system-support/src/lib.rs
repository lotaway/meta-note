pub mod api;
pub mod application;
pub mod domain;
pub mod infrastructure;

use napi_derive::napi;

pub use api::*;

#[napi]
pub fn init() {
  println!("Support initialled");
}