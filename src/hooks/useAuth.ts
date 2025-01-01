import useWebsocket, { SocketStatus } from "@/hooks/useWebsocket.ts"
import { useCookies } from "react-cookie"
import { toast } from "sonner"

export default function useAuth() {
    const { websocket, setStatus } = useWebsocket()
    const [cookies, setCookie] = useCookies(["token", "user"])

    return {
        authenticate: async (token?: string) => {
            const { error, data } = await websocket.emitWithAck("login", token ?? cookies.token)

            if (error) return toast.error("Failed to authenticate")

            const { user, maxAge } = data as { user: any, maxAge: number }
            
            setCookie("user", user, { maxAge })
            setStatus(SocketStatus.Connected)
        }
    }
}