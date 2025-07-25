use std::sync::Mutex;

lazy_static::lazy_static! {
    static ref LAST_WINDOW: Mutex<Option<isize>> = Mutex::new(None);
}

pub fn store_last_focused_window() {
    #[cfg(target_os = "windows")]
    windows_store_last_focused_window();
}

#[cfg(target_os = "windows")]
fn windows_store_last_focused_window() {
    use windows::Win32::UI::WindowsAndMessaging::GetForegroundWindow;

    unsafe {
        let hwnd = GetForegroundWindow();
        if hwnd.0 != std::ptr::null_mut() {
            *LAST_WINDOW.lock().unwrap() = Some(hwnd.0 as isize);
            println!("Stored last window: {:?}", hwnd);
        }
    }
}

pub fn refocus_last_window() {
    #[cfg(target_os = "windows")]
    windows_refocus_last_window();
}

#[cfg(target_os = "windows")]
fn windows_refocus_last_window() {
    use windows::Win32::{
        UI::WindowsAndMessaging::SetForegroundWindow,
        Foundation::HWND
    };

    if let Some(hwnd_val) = *LAST_WINDOW.lock().unwrap() {
        unsafe {
            let _ = SetForegroundWindow(HWND(hwnd_val as *mut std::ffi::c_void));
            println!("Refocused window: {:?}", hwnd_val);
        }
    } else {
        println!("No stored window to refocus.");
    }
}