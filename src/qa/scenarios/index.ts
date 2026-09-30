import { accounts } from './a1-accounts';
import { projects } from './a2-projects';
import { records } from './a3-records';
import { trust } from './a4-trust';
import { AREAS } from './dsl';
import type { Scenario } from '../types';

/** The master inventory. Order follows the numbered areas. */
export const SCENARIOS: Scenario[] = [...accounts, ...projects, ...records, ...trust];
export { AREAS };

const byId = new Map<string, Scenario>();
SCENARIOS.forEach((s) => {
  if (byId.has(s.id)) throw new Error(`Duplicate scenario id ${s.id}`);
  byId.set(s.id, s);
});

export const scenarioById = (id: string) => byId.get(id.toUpperCase());
export const areaName = (code: string) => AREAS.find((a) => a.code === code)?.name ?? code;
