import { Socket, io } from "socket.io-client";
import { create } from "zustand";
import { WEBSOCKET_URL } from "../utils/constants.ts";

interface WebsocketState {
  websocket: Socket,
  data: {
    webInterfaceCode: string,
    soundSizeLimit: number
  } | null,
  connected: boolean
}

const url = new URL(WEBSOCKET_URL)

export const socket = io(url.origin, {
  path: (url.pathname == "/" ? "" : url.pathname) + "/socket.io",
  auth: {
    token: getCookie("token")
  },
  transports: ["websocket"],
  protocols: ["soundboard-v4"]
})

const store = create<WebsocketState>()(() => ({
  websocket: socket,
  data: null,
  connected: true
}))

export default store

socket.io.on("open", () => {
  store.setState({ connected: true })
})

socket.io.on("close", () => {
  store.setState({ connected: false })
})

socket.on("init", (data) => {
  const state = store.getState()
  state.data = data
  store.setState(state)
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