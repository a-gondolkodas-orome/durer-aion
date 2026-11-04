import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import Koa from "koa";
import Router from "@koa/router";
import type { Server } from "boardgame.io";
import { parse } from "yaml";
import { TEAM_TSV_PROBLEM_CODES } from "schemas";
import type { TeamsRepository } from "./db";
import { requireAdmin } from "./admin_session";
import { configureTeamsRouter } from "./router";

// swagger.yaml is written by hand; this is what keeps its route list honest.
// It checks which routes exist and their path parameters, not the shapes of
// what they answer.

const HTTP_METHODS = ["get", "put", "post", "delete", "patch", "options", "head"];

interface Operation { parameters?: { in: string; name: string }[] }
interface Spec {
  paths: Record<string, Record<string, Operation>>;
  components: { schemas: { TeamTsvProblem: { properties: { code: { enum: string[] } } } } };
}

const spec = parse(readFileSync(join(__dirname, "..", "..", "swagger.yaml"), "utf8")) as Spec;

function servedRoutes() {
  const router = new Router<Koa.DefaultState, Server.AppCtx>();
  configureTeamsRouter(router, {} as TeamsRepository, [], requireAdmin("unused"));
  return router.stack.flatMap(layer => layer.methods
    // koa-router adds HEAD to every GET
    .filter(method => method !== "HEAD")
    .map(method => `${method} ${layer.path.replace(/:(\w+)/g, "{$1}")}`));
}

function documentedRoutes() {
  return Object.entries(spec.paths).flatMap(([path, item]) => Object.keys(item)
    .filter(key => HTTP_METHODS.includes(key))
    .map(method => `${method.toUpperCase()} ${path}`));
}

describe("swagger.yaml", () => {
  it("documents exactly the routes the router serves", () => {
    expect(documentedRoutes().sort()).toEqual(servedRoutes().sort());
  });

  it("declares each path parameter its path names", () => {
    for (const [path, item] of Object.entries(spec.paths)) {
      const inPath = [...path.matchAll(/\{(\w+)\}/g)].map(match => match[1]).sort();
      for (const method of Object.keys(item).filter(key => HTTP_METHODS.includes(key))) {
        const declared = (item[method].parameters ?? [])
          .filter(parameter => parameter.in === "path")
          .map(parameter => parameter.name)
          .sort();
        expect(declared, `${method.toUpperCase()} ${path}`).toEqual(inPath);
      }
    }
  });
});

// A code added to the import's problem list reaches every caller at once, and a
// client generated or validated from the document refuses an answer carrying
// one it does not list — as it would have the codes a re-import draws, the
// answer the server gives most often.
describe("the team import's problem codes in swagger.yaml", () => {
  it("are exactly the ones the import can report", () => {
    expect([...spec.components.schemas.TeamTsvProblem.properties.code.enum].sort())
      .toEqual([...TEAM_TSV_PROBLEM_CODES].sort());
  });
});
