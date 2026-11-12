/**
 * Road connections AHA already sells between destination slugs.
 * This is the route graph until a route_edges table exists.
 * An edge means a road (or the Mara–Serengeti border) is operated.
 * It does not by itself create a price. Price still requires a transfer_options row.
 */
export const ROUTE_EDGES: ReadonlyArray<readonly [string, string]> = [
  ["nairobi", "maasai-mara"],
  ["nairobi", "amboseli"],
  ["nairobi", "lake-nakuru"],
  ["nairobi", "lake-naivasha"],
  ["nairobi", "tsavo-east"],
  ["nairobi", "tsavo-west"],
  ["nairobi", "diani"],
  ["nairobi", "ol-pejeta"],
  ["lake-nakuru", "lake-naivasha"],
  ["lake-nakuru", "maasai-mara"],
  ["lake-naivasha", "maasai-mara"],
  ["lake-nakuru", "ol-pejeta"],
  ["amboseli", "tsavo-west"],
  ["tsavo-west", "tsavo-east"],
  ["ngorongoro", "serengeti"],
  ["ngorongoro", "lake-manyara"],
  ["arusha", "ngorongoro"],
  ["arusha", "lake-manyara"],
  ["maasai-mara", "serengeti"],
];

export function routeNeighbors(slug: string): string[] {
  const links: string[] = [];
  for (const [left, right] of ROUTE_EDGES) {
    if (left === slug) links.push(right);
    else if (right === slug) links.push(left);
  }
  return links;
}

/** Shortest path by hop count. Intermediate nodes must be in `allowed`. */
export function shortestRoute(from: string, to: string, allowed: Set<string>): string[] | null {
  if (from === to) return [from];
  if (!allowed.has(from) || !allowed.has(to)) return null;
  const queue: string[][] = [[from]];
  const seen = new Set<string>([from]);
  while (queue.length > 0) {
    const path = queue.shift()!;
    const tip = path[path.length - 1]!;
    for (const next of routeNeighbors(tip)) {
      if (seen.has(next) || !allowed.has(next)) continue;
      const extended = [...path, next];
      if (next === to) return extended;
      seen.add(next);
      queue.push(extended);
    }
  }
  return null;
}
