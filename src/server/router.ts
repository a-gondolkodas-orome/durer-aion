import type Router from '@koa/router';
import koaBody from 'koa-body';
import type { Server } from 'boardgame.io';
import { TeamsRepository } from './db';

export function configureTeamsRouter(router: Router, teams: TeamsRepository) {
  router.get('/teams', koaBody(), async (ctx: any) => {
    const filter_string = ctx.request.query['filter'];
    let filters;
    if (filter_string === undefined) {
      filters = [];
    } else {
      filters = filter_string.split(',');
    }
    ctx.body = await teams.fetch(filters);
//    ctx.body = ['8eae8669-125c-42e5-8b49-89afbac31679', '18c3a69d-c477-4578-8dc1-6e430fbb4e80', '48df4969-a834-4131-ab75-24069a56d2d6'];
  });
}
