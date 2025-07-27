import { currentMonitor, cursorPosition, monitorFromPoint } from "@tauri-apps/api/window";
import { LINUX_DISPLAY_SERVER } from "./constants";

export async function getActiveMonitor() {
    if (LINUX_DISPLAY_SERVER == "none" || LINUX_DISPLAY_SERVER == "x11") {
        const pos = await cursorPosition();
        
        return await monitorFromPoint(pos.x, pos.y);
    } else return await currentMonitor();
}