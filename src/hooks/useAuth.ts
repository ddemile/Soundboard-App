import useWebsocket from "@/hooks/useWebsocket.ts"
import { toast } from "sonner"

export default function useAuth() {
    const { websocket } = useWebsocket()

    return {
        authenticate: async (token: string) => {
            const { error } = await websocket.emitWithAck("login", token)

            if (error) return toast.error("Failed to authenticate")
        }
    }
}