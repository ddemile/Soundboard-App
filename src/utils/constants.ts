import { getMatches } from "@tauri-apps/plugin-cli";
import { createLogger } from "./logging";
import { invoke } from "@tauri-apps/api/core";

const matches = await getMatches();

const forceAPI = matches.args.api?.value

const log = createLogger({ name: "API", debugColor: "blue" })

const useProductionAPI = (forceAPI == "prod" ? true : forceAPI == "dev" ? false : null) ?? import.meta.env.PROD;

export const BASE_API_URL = useProductionAPI ? "https://soundboard.ddemile.me/api" : "http://localhost:4444"

log(`Using ${useProductionAPI ? "production" : "development"} API`)

type LinuxDisplayServer = "none" | "x11" | "wayland" | "unknown"

export const LINUX_DISPLAY_SERVER: LinuxDisplayServer = await invoke("get_linux_display_server");