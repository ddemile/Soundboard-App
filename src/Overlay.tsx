import { listen } from "@tauri-apps/api/event";
import { currentMonitor, getAllWindows, LogicalPosition } from "@tauri-apps/api/window";
import { MouseEventHandler, useCallback, useMemo, useRef, useState } from "react";
import logo from "../src-tauri/icons/icon.png";
import OverlayWheel from "./components/OverlayWheel";
import useOverlayStore from "./hooks/useOverlayStore";
import './Overlay.css';
import type { SoundEntry } from "./pages/Home";

listen("overlay_data", (event) => {
    const data = event.payload as SoundEntry[];

    useOverlayStore.setState({
        sounds: data
    })
})

const mainWindow = (await getAllWindows()).find(window => window.label == "main")!

const radius = 150
const middleCircleMultiplier = 0.17
const middleCircleRadius = radius * middleCircleMultiplier
const activeMultiplier = 1.2

function Overlay() {
    const [activeSection, setActiveSection] = useState<number | null>(null);
    const [middleCircleActive, setMiddleCirlceActive] = useState<boolean>(false);
    const activeSectionRef = useRef(activeSection);
    const { sounds } = useOverlayStore();

    const data = useMemo(() => {
        return sounds.map(sound => ({ icon: sound.emoji ?? "🎵" }))
    }, [sounds])

    const mouseMoveHandler: MouseEventHandler = useCallback(async (event) => {
        const sections = sounds.length;
        const sectionSize = 360 / sections;

        const pos = new LogicalPosition(event.clientX, event.clientY);
        
        const monitor = await currentMonitor();
        
        if (!monitor) return;

        const { x: centerX, y: centerY } = {
            x: window.innerWidth / 2,
            y: window.innerHeight / 2
        }

        const adjacent = pos.x - centerX;
        const opposite = pos.y - centerY;

        const angle = (Math.atan2(opposite, adjacent) * (180 / Math.PI) + 360) % 360;

        const distanceToCenter = Math.sqrt(Math.pow(adjacent, 2) + Math.pow(opposite, 2))

        setMiddleCirlceActive(distanceToCenter <= middleCircleRadius)

        let activeSection: number | null = null;

        if (distanceToCenter > middleCircleRadius) {
            for (let i = 0; i < sections; i++) {
                const startAngle = i * sectionSize;
                const endAngle = startAngle + sectionSize;

                const isActive = angle >= startAngle && angle < endAngle;

                if (isActive) {
                    activeSection = i;
                }
            }
        }

        if (activeSection != activeSectionRef.current) {
            mainWindow.emit("sound_hovered", activeSection != null ? sounds[activeSection].id : null)
        }

        activeSectionRef.current = activeSection;
        setActiveSection(activeSection);
    }, [sounds])

    return (
        <main className="w-full h-screen flex items-center justify-center bg-black/50 text-white flex-col relative" onClick={() => mainWindow.emit("close_overlay")} onMouseMove={mouseMoveHandler}>
            <div className="absolute top-0 left-0 m-2 flex gap-2 items-center">
                <img className="max-h-8" src={logo} />
                <p className="text-xl ">Soundboard overlay</p>
            </div>
            <OverlayWheel data={data} radius={radius} activeSection={activeSection} activeMultiplier={activeMultiplier} middleCircleHovered={middleCircleActive} />
            <p className="absolute text-xl" style={{ translate: `0 calc(50% + ${radius * activeMultiplier + 5}px)` }}>{activeSection != null ? sounds[activeSection].title : "No sound selected"}</p>
        </main>
    );
}

export default Overlay;
