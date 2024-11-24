import { ComponentProps, PropsWithChildren, createContext, useCallback, useContext, useRef, useState } from "react";
import ConfirmDialog from "../../components/ConfirmDialog.tsx";

type Params = Partial<
    Omit<ComponentProps<typeof ConfirmDialog>, "open" | "onConfirm" | "onCancel">
>;

const defaultFunction = (_p?: Params) => Promise.resolve(true); // En l'absence de contexte, on renvoie true directement

const defaultValue = {
    confirmRef: {
        current: defaultFunction,
    },
};

const ConfirmContext = createContext(defaultValue);

export function ConfirmContextProvider({ children }: PropsWithChildren) {
    const confirmRef = useRef(defaultFunction);
    return (
        <ConfirmContext.Provider value={{ confirmRef }}>
            {children}
            <ConfirmDialogWithContext />
        </ConfirmContext.Provider>
    );
}

function ConfirmDialogWithContext() {
    const [open, setOpen] = useState(false);
    const [props, setProps] = useState<undefined | Params>();
    const resolveRef = useRef((_v: boolean) => { });
    const { confirmRef } = useContext(ConfirmContext);
    confirmRef.current = (props) =>
        new Promise((resolve) => {
            setProps(props);
            setOpen(true);
            resolveRef.current = resolve;
        });

    const onConfirm = () => {
        resolveRef.current(true);
        setOpen(false);
    };

    const onCancel = () => {
        resolveRef.current(false);
        setOpen(false);
    };
    return (
        <ConfirmDialog
            onConfirm={onConfirm}
            onCancel={onCancel}
            isOpen={open}
            title={props?.title!}
            subtitle={props?.subtitle!}
            {...props}
        />
    );
}

export function useConfirm() {
    const { confirmRef } = useContext(ConfirmContext);
    return {
        confirm: useCallback(
            (p: Params) => {
                return confirmRef.current(p);
            },
            [confirmRef]
        ),
    };
}