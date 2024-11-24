import useModal from "@/hooks/useModal.ts";
import Modal from "./Modal.tsx";

export default function ImageViewerModal() {
    const { isOpen, setIsOpen, props: initialProps } = useModal("imageViewer")

    return <Modal isOpen={isOpen} onRequestClose={() => setIsOpen(false)}>
        <img src={initialProps.src} width={initialProps.width} height={initialProps.height} />
    </Modal>
}
