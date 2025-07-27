import chalk, { ForegroundColorName } from "chalk";

export function createLogger({ name, debugColor }: { name: string, debugColor: ForegroundColorName }) {
    return (...args: string[]) => console.log(`${chalk[debugColor](`[${name}]`)} ${args.join(" ")}`)
}