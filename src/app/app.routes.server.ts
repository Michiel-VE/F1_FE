import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'prediction/view/:poolId',
    renderMode: RenderMode.Server
  },
  {
    path: 'prediction/editor/:poolId',
    renderMode: RenderMode.Server
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];