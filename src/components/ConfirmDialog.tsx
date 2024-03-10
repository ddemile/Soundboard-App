import { FaTriangleExclamation } from "react-icons/fa6";
import Modal from './modals/Modal.tsx';
import { SmallModal } from "./modals/SmallModal.tsx";

export default function ConfirmDialog({ onConfirm, onCancel, isOpen, title, subtitle }: { onConfirm: () => void, onCancel: () => void, isOpen: boolean, title: string, subtitle: string }) {
    return (
        <Modal isOpen={isOpen} onRequestClose={onCancel} shouldCloseOnEsc={false} shouldCloseOnOverlayClick={false}>
            <SmallModal.Container>
                <SmallModal.Content className="pb-4">
                    <span className=" mx-auto my-5">
                        <FaTriangleExclamation className="text-neutral-300 dark:text-neutral-500" size={50} />
                    </span>
                    <p className="font-bold text-xl mt-1">{title}</p>
                    <p>{subtitle}</p>
                </SmallModal.Content>
                <SmallModal.Footer>
                    <SmallModal.Button onClick={onCancel} variant="discard">Cancel</SmallModal.Button>
                    <button onClick={onConfirm} className="text-white disabled:text-zinc-400 disabled:cursor-not-allowed rounded-md bg-red-500 dark:bg-red-800 hover:bg-red-600 dark:hover:bg-red-900 transition-colors duration-300 p-1 px-4">Confirm</button>
                </SmallModal.Footer>
            </SmallModal.Container>
        </Modal>
    )
}
