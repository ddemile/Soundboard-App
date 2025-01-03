import { Socket, io } from "socket.io-client";
import { create } from "zustand";
import { WEBSOCKET_URL } from "../utils/constants.ts";

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

const url = new URL(WEBSOCKET_URL)

export const socket = io(url.origin, {
  path: (url.pathname == "/" ? "" : url.pathname) + "/socket.io",
  auth: {
    token: getCookie("token")
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

function getCookie(cname: string) {
  let name = cname + "=";
  let decodedCookie = decodeURIComponent(document.cookie);
  let ca = decodedCookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}