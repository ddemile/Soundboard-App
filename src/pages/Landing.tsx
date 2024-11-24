import Spinner from "@/components/Spinner.tsx";
import { Button } from "@/components/ui/button.tsx";
import useAuth from "@/hooks/useAuth.ts";
import useWebsocket from '@/hooks/useWebsocket.ts';
import { getCurrent, onOpenUrl } from "@tauri-apps/plugin-deep-link";
import { open } from "@tauri-apps/plugin-shell";
import { useState } from "react";
import { useCookies } from "react-cookie";
import { useNavigate } from "react-router-dom";

type LoginCallbackResponse = {
    error: null 
    data: {
        token: string
        maxAge: number
    }
} | {
    error: string
    data: null
}

export default function Landing() {
    const { websocket: socket } = useWebsocket()
    const [_, setCookie] = useCookies(["token", "user"]);
    const { authenticate } = useAuth()
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)

    const handleClick = async () => {
        if (loading) return;

        setLoading(true)

        const current = await getCurrent()

        let ignore = !!current
        const unlisten = await onOpenUrl(async ([_url]) => {
            if (ignore) {
                ignore = false
                return
            }

            const url = new URL(_url)
            const { error, data } = await socket.emitWithAck("auth_callback", url.searchParams.get("code")) as LoginCallbackResponse

            unlisten()

            if (error) return

            setCookie("token", data!.token, {
                maxAge: data!.maxAge
            })

            await authenticate(data!.token)

            navigate("/")
        })

        const url = await socket.emitWithAck("request_login_payload") as string

        open(url)
    }

    return (
        <main className="h-full flex justify-center items-center">
            <div className="absolute top-[30%] w-full">
                <div className="flex items-center justify-center flex-col gap-5 w-full">
                    <span className="flex flex-col lg:flex-row items-center">
                        <h1 className="text-7xl inline font-semibold whitespace-nowrap">Welcome to the&nbsp;</h1>
                        <h1 className="tracking-tight text-transparent text-7xl inline font-semibold bg-linear-to-r bg-clip-text from-orange-400 to-orange-600">Soundboard</h1>
                    </span>
                    <div className="flex">
                        <h2 className="text-4xl">Before you get started let's log to&nbsp;</h2>
                        <h1 className="tracking-tight text-4xl text-[#5865F2]">Discord</h1>
                    </div>
                    <Button size={"lg"} variant={"secondary"} onClick={handleClick}>Login</Button>
                </div>
            </div>
            {loading && (
                <>
                    <div className="absolute h-screen w-screen opacity-20 bg-black"></div>
                    <Spinner />
                </>
            )}   
        </main>
    )
}