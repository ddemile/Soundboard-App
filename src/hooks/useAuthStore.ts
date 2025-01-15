import { useQueries, useQueryClient } from "@tanstack/react-query";
import { load } from "@tauri-apps/plugin-store";

interface User {
    id: string
    username: string
    global_name: string
    avatar: string
}

const authStore = await load('auth.json')

type KeyMap = {
    token: string,
    user: User
}

export default function useAuthStore() {
    const queryClient = useQueryClient()

    const [{ data: token, isLoading: isTokenLoading }, { data: user, isLoading: isUserLoading }] = useQueries({
        queries: [
            {
                queryKey: ["token"],
                queryFn: async () => {
                    const result = authStore.get("token") as Promise<string>
                    return result ?? null
                },
            },
            {
                queryKey: ["user"],
                queryFn: async () => {
                    const result = authStore.get("user") as Promise<User>
                    return result ?? null
                },
            }
        ]
    })

    return {
        set: <K extends keyof KeyMap>(key: K, value: KeyMap[K]) => {
            authStore.set(key, value)
            queryClient.setQueryData([key], value)
        },
        delete: (key: keyof KeyMap) => {
            authStore.delete(key)
            queryClient.removeQueries({
                queryKey: [key]
            })
        },
        token,
        user,
        isTokenLoading,
        isUserLoading
    }
}