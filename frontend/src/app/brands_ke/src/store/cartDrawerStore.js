import { create } from 'zustand';

const useCartDrawerStore = create((set) => ({
  isOpen: false,
  openCartDrawer: () => set({ isOpen: true }),
  closeCartDrawer: () => set({ isOpen: false }),
  toggleCartDrawer: () => set((state) => ({ isOpen: !state.isOpen })),
}));

export default useCartDrawerStore;

