use base64::{engine::general_purpose::STANDARD, Engine as _};
use image::{DynamicImage, ImageFormat};
use screenshots::Screen;
use std::io::Cursor;

#[tauri::command]
fn capture_primary_screen() -> Result<String, String> {
    let screens = Screen::all().map_err(|error| error.to_string())?;
    let screen = screens
        .first()
        .ok_or_else(|| String::from("No display detected."))?;

    let image = screen.capture().map_err(|error| error.to_string())?;
    let dynamic_image = DynamicImage::ImageRgba8(image);
    let mut buffer = Cursor::new(Vec::new());

    dynamic_image
        .write_to(&mut buffer, ImageFormat::Png)
        .map_err(|error| error.to_string())?;

    Ok(STANDARD.encode(buffer.into_inner()))
}

pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![capture_primary_screen])
        .run(tauri::generate_context!())
        .expect("error while running NovaMind AI");
}
