export class Coord {
  constructor(public x: number, public y: number) {}
  public distance(other: Coord): number {
    const deltaX = this.x - other.x;
    const deltaY = this.y - other.y;
    return Math.sqrt(deltaX ** 2 + deltaY ** 2);
  }
  public distanceSq(other: Coord): number {
    const deltaX = this.x - other.x;
    const deltaY = this.y - other.y;
    return deltaX ** 2 + deltaY ** 2;
  }
}
export class wNode {
  public inputs: number;
  constructor(
    public name: string,
    public id: number,

    public location: Coord,
    public type: NodeType
  ) {
    this.inputs = 0;
  }
}

export enum NodeType {
  Empty = 0,
  Mine = 1,
  Factory = 2,
  Market = 3,
}

export class Edge {
  public travel: number;
  public travelDistance: number;
  public length: number;
  constructor(public start: wNode, public end: wNode) {
    this.length = start.location.distance(end.location);
    this.travel = 0;
    this.travelDistance = 0;
  }
}
type PathTableEntry = [wNode, Edge];
export function UpdateTravel(nodes: wNode[], edges: Edge[]) {
  // make table of all path distances between nodes, null if there is no path
  let distTable: (number | null)[][] = [];

  // pathTable holds both the next node in the path and which edge to take
  let pathTable: (PathTableEntry | null)[][] = [];

  for (let i = 0; i < nodes.length; i++) {
    distTable[i] = [];
    pathTable[i] = [];
    for (let j = 0; j < nodes.length; j++) {
      distTable[i][j] = null;
      pathTable[i][j] = null;
    }
    nodes[i].inputs = nodes[i].type == NodeType.Mine ? 1 : 0;
  }
  for (let i = 0; i < edges.length; i++) {
    let e = edges[i];
    e.travel = 0;
    e.travelDistance = 0;
    let start = nodes.indexOf(e.start);
    let end = nodes.indexOf(e.end);
    distTable[start][end] = e.length;
    distTable[end][start] = e.length;
    pathTable[start][end] = [e.end, e];
    pathTable[end][start] = [e.start, e];
  }

  // Floyd-Warshall algorithm
  for (let k = 0; k < nodes.length; k++) {
    for (let i = 0; i < nodes.length; i++) {
      for (let j = 0; j < nodes.length; j++) {
        if (distTable[i][k] == null || distTable[k][j] == null || i == j)
          continue;
        let d = distTable[i][k]! + distTable[k][j]!;
        if (distTable[i][j] == null || d < distTable[i][j]!) {
          distTable[i][j] = d;
          pathTable[i][j] = pathTable[i][k];
        }
      }
    }
  }

  // make list of Factory nodes and list of Mine nodes
  let factories: wNode[] = [];
  let mines: wNode[] = [];
  let markets: wNode[] = [];
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].type == NodeType.Factory) factories.push(nodes[i]);
    if (nodes[i].type == NodeType.Mine) mines.push(nodes[i]);
    if (nodes[i].type == NodeType.Market) markets.push(nodes[i]);
  }

  trackInputs(factories, mines, distTable, pathTable);
  trackInputs(markets, factories, distTable, pathTable);
}

function trackInputs(
  destinations: wNode[],
  sources: wNode[],
  distTable: (number | null)[][],
  pathTable: (PathTableEntry | null)[][]
) {
  // for each mine, find the closest factory using the distances tables, and store the path
  for (let i = 0; i < sources.length; i++) {
    let src = sources[i];
    let closestDest: wNode | null = null;
    let closestDestDistance: number | null = null;

    for (let j = 0; j < destinations.length; j++) {
      let dest = destinations[j];
      let d = distTable[src.id][dest.id];
      if (d == null) continue; // no path to get there

      if (closestDest == null || d < closestDestDistance!) {
        closestDest = dest;
        closestDestDistance = d;
      }
    }
    if (closestDest == null) continue;
    let p = pathTable[src.id][closestDest.id];

    // follow the path from the factory to the mine, and update the travel count of each edge
    while (p != null) {
      let edge = p[1];
      edge.travel += src.inputs;
      edge.travelDistance += edge.length;
      if (edge.start == closestDest || edge.end == closestDest) {
        closestDest.inputs += src.inputs;
        break;
      }
      p = pathTable[p[0].id][closestDest.id];
    }
  }
}

export function CreateNodes(nodeCount: number, radius: number): wNode[] {
  let nodes: wNode[] = [];
  for (let i = 0; i < nodeCount; i++) {
    let n = new wNode(
      i.toString(),
      i,
      getRandomPointInsideCircle(radius),
      Math.random() < 0.7 ? NodeType.Mine : NodeType.Factory
    );
    nodes.push(n);
  }
  for (let i = 0; i < 20; i++) {
    pushNodesApart(nodes, 30);
  }

  // order nodes by x position
  nodes.sort((a, b) => a.location.x - b.location.x);
  // set node names and ids to match their index in the array
  for (let i = 0; i < nodes.length; i++) {
    nodes[i].name = i.toString();
    nodes[i].id = i;
  }

  return nodes;
}

function pushNodesApart(nodes: wNode[], minDistance: number) {
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const nodeA = nodes[i];
      const nodeB = nodes[j];

      const distanceX = nodeA.location.x - nodeB.location.x;
      const distanceY = nodeA.location.y - nodeB.location.y;

      const currentDistance = Math.sqrt(distanceX ** 2 + distanceY ** 2);

      if (currentDistance < minDistance) {
        const pushDistance = (minDistance - currentDistance) / 2;
        const pushX = (distanceX / currentDistance) * pushDistance;
        const pushY = (distanceY / currentDistance) * pushDistance;

        nodeA.location.x += pushX;
        nodeA.location.y += pushY;

        nodeB.location.x -= pushX;
        nodeB.location.y -= pushY;
      }
    }
  }
}

function getRandomPointInsideCircle(radius: number): Coord {
  const angle = Math.random() * 2 * Math.PI; // random angle between 0 and 2π
  const randomRadius = Math.sqrt(Math.random()) * radius; // random radius between 0 and the given radius
  const x = randomRadius * Math.cos(angle); // calculate x-coordinate
  const y = randomRadius * Math.sin(angle); // calculate y-coordinate
  return new Coord(x, y);
}
