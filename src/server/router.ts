import type Router from '@koa/router';
import koaBody from 'koa-body';
import type { Server } from 'boardgame.io';

export function configureTeamsRouter(router: Router<any, Server.AppCtx>) {
  router.get('/teams', koaBody(), async (ctx) => {
    // TODO: stub
    ctx.body = ['8eae8669-125c-42e5-8b49-89afbac31679', '18c3a69d-c477-4578-8dc1-6e430fbb4e80', '48df4969-a834-4131-ab75-24069a56d2d6'];
  });
}

/// Team/re
