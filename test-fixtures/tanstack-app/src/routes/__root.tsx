import { createRootRoute, createRoute } from '@tanstack/react-router';

export const rootRoute = createRootRoute({
  component: () => <div>Hello from TanStack Router</div>,
});

export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => <div>Home</div>,
});
