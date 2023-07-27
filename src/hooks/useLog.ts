import chalk, { ForegroundColorName } from "chalk";

export default function useLog({ debugColor = "magenta" }: { debugColor?: ForegroundColorName }) {
    return (...args: string[]) => console.log(`${chalk[debugColor]("[Debug]")} ${args.join(" ")}`)
}