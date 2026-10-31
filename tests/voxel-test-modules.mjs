import { readFile } from "node:fs/promises";
import ts from "typescript";

const modules = new Map();
async function moduleUrl(name) {
  if (modules.has(name)) return modules.get(name);
  const source = await readFile(new URL(`../app/voxel/${name}.ts`, import.meta.url), "utf8");
  let compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
  const names = [...new Set([...compiled.matchAll(/from\s+["']\.\/([\w-]+)["']/g)].map((match) => match[1]))];
  for (const dependency of names) {
    const url = await moduleUrl(dependency);
    compiled = compiled.replaceAll(`"./${dependency}"`,JSON.stringify(url)).replaceAll(`'./${dependency}'`,JSON.stringify(url));
  }
  const url = `data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`;
  modules.set(name,url);
  return url;
}
export async function loadVoxelModule(name) { return import(await moduleUrl(name)); }
