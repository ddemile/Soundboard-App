import useWebsocket, { SocketStatus } from "@/hooks/useWebsocket.ts"
import { useCookies } from "react-cookie"

export default function useAuth() {
    const { websocket, setStatus } = useWebsocket()
    const [cookies, setCookie] = useCookies(["token", "user"])

    return {
        authenticate: async (token?: string) => {
            const { user, maxAge } = await websocket.emitWithAck("login", token ?? cookies.token) as { user: any, maxAge: number }

            setCookie("user", user, { maxAge })
            setStatus(SocketStatus.Connected)
        }
    }
}