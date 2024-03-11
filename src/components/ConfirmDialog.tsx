import { FaTriangleExclamation } from "react-icons/fa6";
import Modal from './modals/Modal.tsx';
import { SmallModal } from "./modals/SmallModal.tsx";

export default function ConfirmDialog({ onConfirm, onCancel, isOpen, title, subtitle }: { onConfirm: () => void, onCancel: () => void, isOpen: boolean, title: string, subtitle: string }) {
    return (
        <Modal isOpen={isOpen} onRequestClose={onCancel} shouldCloseOnEsc={false} shouldCloseOnOverlayClick={false}>
            <SmallModal.Container>
                <SmallModal.Content className="pb-4">
                    <span className="mx-auto my-5">
                        <FaTriangleExclamation className="text-neutral-300 dark:text-neutral-500" size={50} />
                    </span>
                    <SmallModal.Title className="text-xl">{title}</SmallModal.Title>
                    <p>{subtitle}</p>
                </SmallModal.Content>
                <SmallModal.Footer>
                    <SmallModal.Button onClick={onCancel} variant="discard">Cancel</SmallModal.Button>
                    <SmallModal.Button onClick={onConfirm} variant="danger">Confirm</SmallModal.Button>
                </SmallModal.Footer>
            </SmallModal.Container>
        </Modal>
    )
}
