import useModals from './useModals.ts'

export default function useModal(name: string) {
  const { useModal } = useModals()

  return useModal(name)
}
