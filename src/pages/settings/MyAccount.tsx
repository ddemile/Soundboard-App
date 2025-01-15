import useModal from "@/hooks/useModal.ts";
import useWebsocket from "../../hooks/useWebsocket.ts";

export default function MyAccount() {
  const { close } = useModal("settings");
  const { logout } = useWebsocket();
  const user = localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")!) : null
  
  return (
    <>
      <h1 className="text-3xl font-semibold text-left mb-2">My account</h1>
      {user && (
        <div className="w-full bg-neutral-200 dark:bg-[#141414] max-w-3xl flex rounded-md p-4 items-center gap-3">
          <img
            className="rounded-full w-40 border-4 border-zinc-300 dark:border-zinc-800"
            src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=512`}
          />
          <div className="flex flex-col text-left overflow-hidden">
            <p className="text-4xl font-semibold overflow-hidden text-ellipsis">
              {user.global_name || user.username}
            </p>
            <p className="text-xl font-semibold overflow-hidden text-ellipsis">
              {user.username}
            </p>
          </div>
          <button
            className="text-white ml-auto bg-red-500 rounded-md p-2 px-4"
            onClick={() => {
              localStorage.removeItem("token");
              localStorage.removeItem("user");
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
