import { create } from 'zustand';

export type Route = '/' | '/contacts' | '/memory' | '/settings';

interface RouterState {
  currentRoute: Route;
  navigate: (route: Route) => void;
}

export const useRouterStore = create<RouterState>((set) => ({
  currentRoute: '/',
  navigate: (route) => set({ currentRoute: route }),
}));
