// use std::ffi::c_void;

use std::sync::{Mutex, OnceLock};
use tauri::{
    image::Image, menu::{MenuBuilder, MenuItem, MenuItemBuilder}, tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent}, AppHandle, Manager, State, WindowEvent, Wry
};
use tauri_plugin_autostart::MacosLauncher;

mod utils;

macro_rules! f_string {
    ($($tokens:tt)*) => {
        format!($($tokens)*)
    };
}

#[tauri::command]
fn store_focused_window() {
    utils::focus::store_last_focused_window();
}

#[tauri::command]
fn restore_focused_window() {
    utils::focus::refocus_last_window();
}

#[tauri::command]
fn get_linux_display_server(state: State<'_, Mutex<AppStorage>>) -> &'static str {
    let storage = state.lock().unwrap();

    return storage.linux_display_server;
}

#[cfg(windows)]
fn disable_animations(window: &tauri::WebviewWindow) {
    if let Ok(hwnd) = window.hwnd() {
        unsafe {
            use windows::{core::BOOL, Win32::{Foundation::HWND, Graphics::Dwm::{DwmSetWindowAttribute, DWMWA_TRANSITIONS_FORCEDISABLED}}};

            let value: BOOL = BOOL(1); // 1 = true

            let pv_attribute = &value as *const _ as *const _;
            let cb_attribute = std::mem::size_of_val(&value) as u32;
            
            DwmSetWindowAttribute(HWND(hwnd.0 as _), DWMWA_TRANSITIONS_FORCEDISABLED, pv_attribute, cb_attribute).unwrap();
        }
    }
}

struct AppStorage {
    linux_display_server: &'static str,
}


#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    static TOGGLE_WINDOW: OnceLock<MenuItem<Wry>> = OnceLock::new();

    #[cfg_attr(not(target_os = "linux"), allow(unused_mut))]
    let mut linux_display_server: &str = "none";

    #[cfg(target_os = "linux")]
    {
        use x11rb::connect;
        use std::env;

        if std::env::var("WAYLAND_DISPLAY").is_ok() {
            linux_display_server = "wayland";
        } else if std::env::var("DISPLAY").is_ok() {
            linux_display_server = "x11";
        } else {
            linux_display_server = "unknown";
        }

        // Check if x11 is available
        match connect(None) {
            Ok((_, _)) => {
                env::set_var("GDK_BACKEND", "x11");
                linux_display_server = "x11";
            }
            Err(_) => {
                println!("x11 is not available, using default display server");
            }
        }
    }

    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_single_instance::init(|app, argv, _cwd| {
            println!("a new app instance was opened with {argv:?} and the deep link event was already triggered");
            if let Some(webview_window) = app.get_webview_window("main") {
                let _ = webview_window.show();
                let _ = webview_window.set_focus();
            }
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
        .plugin(tauri_plugin_cli::init())
        .on_window_event(|window, event: &WindowEvent| {
            let toggle_window = TOGGLE_WINDOW.get().unwrap();

            if let WindowEvent::CloseRequested { api, .. } = event {
                window.hide().unwrap();
                api.prevent_close();
                let _ = toggle_window.set_text("Show window");
            }
            if let WindowEvent::Focused(focused) = event {
                if *focused {
                    let _ = toggle_window.set_text("Reduce to system tray");
                }
            }
        })
        .setup(|app| {
            let window = app.get_webview_window("overlay").unwrap();

            app.manage(Mutex::new(AppStorage {
                linux_display_server
            }));

            #[cfg(target_os = "linux")]
            {
                let state = app.state::<Mutex<AppStorage>>();
                let storage = state.lock().unwrap();

                if storage.linux_display_server == "x11" {
                    window.set_fullscreen(true).unwrap();
                }
            }

            #[cfg(windows)]
            {
                disable_animations(&window);
            }

            let _ = TOGGLE_WINDOW.set(MenuItemBuilder::with_id("toggle_window", "Reduce to system tray").build(app)?);
            let quit = MenuItemBuilder::with_id("quit", "Quit").build(app)?;
            let toggle_window = TOGGLE_WINDOW.get().unwrap();
            let menu = MenuBuilder::new(app).items(&[TOGGLE_WINDOW.get().unwrap(), &quit]).build()?;
            let icon = Image::from_bytes(include_bytes!("../icons/icon.png")).unwrap(); // Load the icon
            let _tray = TrayIconBuilder::with_id("main")
                .menu(&menu)
                .on_menu_event(move |app, event| match event.id().as_ref() {
                    "toggle_window" => {
                        if let Some(webview_window) = app.get_webview_window("main") {
                            if webview_window.is_visible().unwrap() {
                                toggle_window.set_text("Show window").unwrap();
                                webview_window.hide().unwrap();
                            } else {
                                webview_window.show().unwrap();
                                webview_window.set_focus().unwrap();
                            }
                        }
                    }
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

            #[cfg(any(windows, target_os = "linux"))]
            {
                use tauri_plugin_deep_link::DeepLinkExt;
                app.deep_link().register_all()?;
            }

            if let Some(webview_window) = app.get_webview_window("main") {
                let title = webview_window.title().unwrap();
                let version = app.package_info().version.to_string();
                let _ = webview_window.set_title(f_string!("{title} (v{version})").as_str());
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![store_focused_window, restore_focused_window, get_linux_display_server])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

// fn pointer_to_isize(ptr: *mut c_void) -> isize {
//     ptr as isize
// }