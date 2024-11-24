use std::ffi::c_void;

use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{
    image::Image,
    menu::{MenuBuilder, MenuItemBuilder},
    AppHandle, Manager, WindowEvent,
};
use tauri_plugin_autostart::MacosLauncher;

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_single_instance::init(|app, argv, _cwd| {
            println!("a new app instance was opened with {argv:?} and the deep link event was already triggered");
            let _ = show_window(app);
        }))
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_autostart::init(
            MacosLauncher::LaunchAgent,
            Some(vec!["--flag1", "--flag2"]),
        ))
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_shell::init())
        .on_window_event(|window, event: &WindowEvent| {
            if let WindowEvent::CloseRequested { api, .. } = event {
                window.hide().unwrap();
                api.prevent_close();
            }
            // if let WindowEvent::Resized(_size) = event {
            //     let hwnd = window.hwnd().unwrap().0;
            //     let hwnd = windows::Win32::Foundation::HWND(pointer_to_isize(hwnd));
            //     unsafe {
            //         use windows::Win32::UI::WindowsAndMessaging::*;
            //         let nindex = GWL_EXSTYLE;
            //         let style: WINDOW_EX_STYLE = WS_EX_APPWINDOW| WS_EX_COMPOSITED | WS_EX_LAYERED | WS_EX_TRANSPARENT | WS_EX_TOPMOST;
            //         let _pre_val = SetWindowLongA(hwnd, nindex, style.0 as i32);
            //     };
            // }
        })
        .setup(|app| {
            let quit = MenuItemBuilder::with_id("quit", "Quit").build(app)?;
            let menu = MenuBuilder::new(app).items(&[&quit]).build()?;
            let icon = Image::from_bytes(include_bytes!("../icons/icon.png")).unwrap(); // Load the icon
            let _tray = TrayIconBuilder::with_id("main")
                .menu(&menu)
                .on_menu_event(move |_app, event| match event.id().as_ref() {
                    "quit" => {
                        std::process::exit(0);
                    }
                    _ => (),
                })
                .tooltip("Soundboard")
                .icon(icon)
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app: &AppHandle = tray.app_handle();
                        if let Some(webview_window) = app.get_webview_window("main") {
                            let _ = webview_window.show();
                            let _ = webview_window.set_focus();
                        }
                    }
                })
                .build(app)?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn pointer_to_isize(ptr: *mut c_void) -> isize {
    ptr as isize
}

fn show_window(app: &AppHandle) {
    let windows = app.webview_windows();

    windows
        .values()
        .next()
        .expect("Sorry, no window found")
        .set_focus()
        .expect("Can't Bring Window to Focus");
}
