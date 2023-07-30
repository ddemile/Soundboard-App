import { io } from "socket.io-client";

// const socket = io("wss://ddemile.nano3.fr:4444")
const socket = io("wss://ddemile.nano3.fr:4444", {
    auth: {
        token: getCookie("token")
    }
})

export default function useWebsocket() {
    return socket; 
}

function getCookie(cname: string) {
    let name = cname + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    for(let i = 0; i <ca.length; i++) {
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