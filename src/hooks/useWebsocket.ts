import { Socket, io } from "socket.io-client";
import { create } from "zustand";
import { WEBSOCKET_URL } from "../utils/constants.ts";

interface WebsocketState {
  websocket: Socket
}

export const socket = io(WEBSOCKET_URL, {
  auth: {
    token: getCookie("token")
  },
  transports: ["websocket"],
  protocols: ["soundboard-v3"]
})

export default create<WebsocketState>()(() => ({
  websocket: socket
}))

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