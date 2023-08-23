import { create } from "zustand"

type Props = Record<string, any>

interface ModalState {
    props: Props,
    isOpen: boolean,
    setIsOpen: (isOpen: boolean) => void,
    setProps: (props: Props) => void,
    open: (props?: Props) => void,
    close: () => void,
    set: (data: Partial<ModalState>) => void 
}

interface ModalsState {
    register: (name: string) => void,
    modals: Record<string, ModalState>,
    useModal: (name: string) => ModalState
}

export default create<ModalsState>()((set, get) => ({
    modals: {},
    register: (name) => {
        set({
            modals: {
                ...get().modals,
                [name]: {
                    isOpen: false,
                    set: (data) => {
                        const { modals } = get()
                        const modal = modals[name]

                        set({ modals: { ...modals, [name]: { ...modal, ...data } } })
                    },
                    setIsOpen: (open) => {
                        const { set } = get().modals[name]

                        set({ isOpen: open })
                    },
                    props: {},
                    setProps: (props) => {
                        const { set } = get().modals[name]

                        set({ props })
                    },
                    open: (props) => {
                        const { set } = get().modals[name]

                        if (props) set({ props, isOpen: true })
                        else set({ isOpen: true })
                    },
                    close: () => {
                        const { set } = get().modals[name]

                        set({ isOpen: false })
                    }
                } satisfies ModalState
            }
        })
    },
    useModal: (name: string) => {
        const { register } = get()

        if (get().modals[name]) return get().modals[name]
        register(name)
        return get().modals[name]
    }
}))