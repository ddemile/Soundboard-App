import { twMerge } from "tailwind-merge";

export default function ProgressBar({ progressPercentage, className = "" }: { progressPercentage: number, className?: string }) {
    return (
        <div className={twMerge('h-1 w-full overflow-hidden', className)}>
            <div
                style={{ width: `${progressPercentage}%`}}
                className="h-full bg-blue-500 transition-all duration-300">
            </div>
        </div>
    );
};