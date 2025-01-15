import { load } from "@tauri-apps/plugin-store";
import { Socket, io } from "socket.io-client";
import { create } from "zustand";
import { BASE_API_URL } from "../utils/constants.ts";

const authStore = await load('auth.json', { autoSave: true })

interface WebsocketState {
  websocket: Socket,
  data: {
    webInterfaceCode: string,
    soundSizeLimit: number
  } | null,
  status: SocketStatus,
  logout: () => void,
  connect: () => void,
  setStatus: (status:  SocketStatus) => void
}

export enum SocketStatus {
  Connecting,
  Reconnecting,
  Connected,
  Disconnected,
  NotAuthenticated
}

const url = new URL(BASE_API_URL)

export const socket = io(url.origin, {
  path: (url.pathname == "/" ? "" : url.pathname) + "/socket.io",
  auth: {
    token: await authStore.get("token")
  },
  transports: ["websocket"],
  protocols: ["soundboard-v4"],
  autoConnect: false
})

const store = create<WebsocketState>()((set, get) => ({
  websocket: socket,
  data: null,
  status: SocketStatus.Connecting,
  logout() {
    const { websocket } = get()
    websocket.emit("logout")

    set({ status: SocketStatus.NotAuthenticated })
  },
  connect() {
    const { websocket } = get()
    websocket.connect()
    set({ status: SocketStatus.Connecting })
  },
  setStatus(status) {
    set({ status })
  },
}))

export default store

socket.io.on("open", () => {
  store.setState({ status: SocketStatus.NotAuthenticated })
})

socket.io.on("close", () => {
  const { status } = store.getState()

  store.setState({ status: status == SocketStatus.NotAuthenticated ? SocketStatus.Disconnected : SocketStatus.Reconnecting })
})