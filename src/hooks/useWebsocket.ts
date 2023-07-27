import { io } from "socket.io-client";

// const socket = io("wss://ddemile.nano3.fr:4444")
const socket = io("wss://ddemile.nano3.fr:4444")

export default function useWebsocket() {
    return socket; 
}