import type Router from '@koa/router';
import koaBody from 'koa-body';
import type { Server } from 'boardgame.io';
import { TeamsRepository } from './db';

export function configureTeamsRouter(router: Router<any, Server.AppCtx>, teams: TeamsRepository) {

  router.get('/team/admin/filter', koaBody(), async (ctx: Server.AppCtx) => {
    const filter_string = ctx.request.query['filter'];
    let filters;
    if (filter_string === undefined) {
      filters = [];
    } else {
      filters = filter_string.split(',');
    }
    ctx.body = await teams.fetch(filters);
    //    ctx.body = ['8eae8669-125c-42e5-8b49-89afbac31679', '18c3a69d-c477-4578-8dc1-6e430fbb4e80', '48df4969-a834-4131-ab75-24069a56d2d6'];
  })

  router.get('/team/join/:token', koaBody(), async (ctx: Server.AppCtx) => {
    const connect_token: string = ctx.params.token ?? 'no-token';
    const team = await teams.getTeam({ joinCode: connect_token });
    ctx.body = team?.id;
    if (team == null)
      ctx.throw(404, "Team not found!")
  })

  router.get(/^\/team\/(?<GUID>[^-]{8}-[^-]{4}-[^-]{4}-[^-]{4}-[^-]{12}$)/, koaBody(), async (ctx: Server.AppCtx) => {
    const GUID = ctx.params.GUID ?? ctx.throw(400)
    console.log(GUID);
    const team = await teams.getTeam({ id: GUID }) ?? ctx.throw(404, `Team with {id:${GUID}} not found.`)
    ctx.body = team;
  });

  router.get('/team/:GUID/relay/play', koaBody(), async (ctx: Server.AppCtx) => {
    ctx.throw(501, "Not implemented yet.");
  })

  router.get('/team/:GUID/strategy/play', koaBody(), async (ctx: Server.AppCtx) => {
    ctx.throw(501, "Not implemented yet.");
  })

  router.get('/team/:GUID/relay/result', koaBody(), async (ctx: Server.AppCtx) => {
    ctx.throw(501, "Not implemented yet.");
  })

  router.get('/team/:GUID/strategy/result', koaBody(), async (ctx: Server.AppCtx) => {
    ctx.throw(501, "Not implemented yet.");
  })


}
