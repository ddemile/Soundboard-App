import { Monitor, monitorFromPoint } from "@tauri-apps/api/window";

export interface Position {
    x: number,
    y: number
}

export function getMonitorCenter(monitor: Monitor): Position {
    return {
        x: monitor.position.x + monitor.size.width / 2,
        y: monitor.position.y + monitor.size.height / 2
    }
}

export async function getDistanceToCenter(pos: Position) {
    const monitor = await monitorFromPoint(pos.x, pos.y)

    const { x: centerX, y: centerY } = getMonitorCenter(monitor!)

    const width = Math.abs(pos.x - centerX)
    const height = Math.abs(pos.y - centerY)

    const distanceToCenter = Math.sqrt(Math.pow(width, 2) + Math.pow(height, 2))

    return distanceToCenter;
}