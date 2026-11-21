import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'drivers/career-history/:lastName',
    renderMode: RenderMode.Server,
  },
  {
    path: 'prediction/editor/:poolId',
    renderMode: RenderMode.Server,
  },
  {
    path: 'prediction/view/:poolId',
    renderMode: RenderMode.Server,
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];