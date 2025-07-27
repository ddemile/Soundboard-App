import { createLogger } from "@/utils/logging";
import { ForegroundColorName } from "chalk";

export default function useLog({ name = "Debug", debugColor = "magenta" }: { name?: string, debugColor?: ForegroundColorName } = {}) {
    return createLogger({ name, debugColor })
}