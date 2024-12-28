import useModal from "@/hooks/useModal.ts";
import { useCookies } from "react-cookie";
import useWebsocket from "../../hooks/useWebsocket.ts";

export default function MyAccount() {
  const [cookies, _setCookie, removeCookie] = useCookies();
  const { close } = useModal("settings");
  const { logout } = useWebsocket();
  
  return (
    <>
      <h1 className="text-3xl font-semibold text-left mb-2">My account</h1>
      {cookies.user && (
        <div className="w-full bg-neutral-200 dark:bg-[#141414] max-w-3xl flex rounded-md p-4 items-center gap-3">
          <img
            className="rounded-full w-40 border-4 border-zinc-300 dark:border-zinc-800"
            src={`https://cdn.discordapp.com/avatars/${cookies.user.id}/${cookies.user.avatar}.png?size=512`}
          />
          <div className="flex flex-col text-left overflow-hidden">
            <p className="text-4xl font-semibold overflow-hidden text-ellipsis">
              {cookies.user.global_name || cookies.user.username}
            </p>
            <p className="text-xl font-semibold overflow-hidden text-ellipsis">
              {cookies.user.username}
            </p>
          </div>
          <button
            className="text-white ml-auto bg-red-500 rounded-md p-2 px-4"
            onClick={() => {
              removeCookie("token");
              removeCookie("user");
              logout();
              close();
            }}
          >
            Logout
          </button>
        </div>
      )}
    </>
  );
}
