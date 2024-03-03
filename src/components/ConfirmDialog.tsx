import { FaTriangleExclamation } from "react-icons/fa6";
import Button from './modals/Button.tsx';
import Modal from './modals/Modal.tsx';

export default function ConfirmDialog({ onConfirm, onCancel, isOpen, title, subtitle }: { onConfirm: () => void, onCancel: () => void, isOpen: boolean, title: string, subtitle: string }) {
    return (
        <Modal isOpen={isOpen} onRequestClose={onCancel} shouldCloseOnEsc={false} shouldCloseOnOverlayClick={false}>
            <div className="rounded-lg w-[440px] overflow-hidden mx-auto">
                <div className="bg-[#303031] p-2 relative flex flex-col pb-4">
                    <span className=" mx-auto my-5">
                        <FaTriangleExclamation className="text-neutral-500" size={50} />
                    </span>
                    <p className="font-bold text-xl mt-1">{title}</p>
                    <p>{subtitle}</p>
                </div>
                <div className="bg-zinc-800 p-3 flex justify-end gap-2">
                    <Button onClick={onCancel} type="discard">Cancel</Button>
                    <button onClick={onConfirm} className="disabled:bg-red-800 disabled:text-zinc-400 disabled:cursor-not-allowed rounded-md bg-red-800 hover:bg-red-900 transition-colors duration-300 p-1 px-4">Confirm</button>
                </div>
            </div>
        </Modal>
    )
}
