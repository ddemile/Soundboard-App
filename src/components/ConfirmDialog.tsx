import Modal from "./modals/Modal.tsx";
import { Button } from "./ui/button.tsx";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/card.tsx";

export default function ConfirmDialog({ onConfirm, onCancel, isOpen, title, subtitle }: { onConfirm: () => void, onCancel: () => void, isOpen: boolean, title: string, subtitle: string }) {
    return (
        <Modal isOpen={isOpen} onRequestClose={onCancel} shouldCloseOnEsc={false} shouldCloseOnOverlayClick={false} className="max-w-lg w-full">
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg font-semibold">{title}</CardTitle>
                    <CardDescription>{subtitle}</CardDescription>
                </CardHeader>
                <CardFooter className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
                    <Button variant="outline" onClick={onCancel}>Cancel</Button>
                    <Button onClick={onConfirm}>Confirm</Button>
                </CardFooter>
            </Card>
        </Modal>
    )
}
