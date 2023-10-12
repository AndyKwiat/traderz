import { CityNames } from "./cityNames.js";
import { Coord, getRandomPointInsideCircle } from "./utils.js";
import { options } from "./app.js";
const NUM_GOODS = 3;
export const WOOD = 0;
export const STONE = 1;
export const FOOD = 2;
export const GoodsNames = ["🪵", "🪨", "🌾"];
class TradeRoute {
  constructor(
    public start: City,
    public end: City,
    public goodType: number,
    public amount: number
  ) {}
}
export let TotalExports: number = 0;

export class City {
  public potentialGoodsProduction: number[] = new Array(NUM_GOODS).fill(0);
  public goodsProduction: number[] = new Array(NUM_GOODS).fill(0);

  public ExportRoutes: TradeRoute[] = [];
  public ImportRoutes: TradeRoute[] = [];

  public population: number = 0;
  public discovered: boolean = false;

  public hasPort: boolean = false;

  public neighbors: City[] = [];
  public longNeighbors: City[] = [];

  constructor(
    public name: string,
    public id: number,

    public location: Coord,

    public type: NodeType
  ) {}

  public hasNeighbor(city: City): boolean {
    return this.neighbors.includes(city);
  }
  public primaryGoodsCount(): number {
    switch (this.type) {
      case NodeType.Forest:
        return this.goodsProduction[WOOD];
      case NodeType.Plains:
        return this.goodsProduction[FOOD];
      case NodeType.Stone:
        return this.goodsProduction[STONE];
      default:
        return 0;
    }
  }

  private IncreaseProduction() {
    if (this.type == NodeType.Forest) {
      this.goodsProduction[WOOD] += 2;
    }
    if (this.type == NodeType.Stone) {
      this.goodsProduction[STONE] += 2;
    }
    if (this.type == NodeType.Plains) {
      this.goodsProduction[FOOD] += 2;
    }
  }

  public AttemptBuildPort(): boolean {
    if (this.goodsProduction[STONE] < 3 || this.hasPort) {
      return false;
    }
    this.goodsProduction[STONE] -= 3;
    this.hasPort = true;
    // push long neighbors into neighbors
    for (let neighbor of this.longNeighbors) {
      if (this.neighbors.includes(neighbor)) continue;
      this.neighbors.push(neighbor);
      neighbor.discovered = true;
      if (neighbor.neighbors.includes(this)) continue;
      neighbor.neighbors.push(this);
    }

    return true;
  }

  public AttemptExport(good: number, target: City): boolean {
    if (this.goodsProduction[good] <= 0) {
      return false;
    }
    this.MustExport(good, target);
    return true;
  }
  public MustExport(good: number, target: City) {
    if (this.goodsProduction[good] <= 0) {
      throw new Error("Can't export a good you don't have");
    }
    this.goodsProduction[good]--;
    target.goodsProduction[good]++;

    // if we're importing the same good from the same city, just delete the import and we don't have to createa  new export since they cancel out
    for (let r of this.ImportRoutes) {
      if (r.goodType == good && r.start == target) {
        this.ImportRoutes.splice(this.ImportRoutes.indexOf(r), 1);
        // now delete the matching export route from teh target
        for (let r2 of target.ExportRoutes) {
          if (r2.goodType == good && r2.end == this) {
            target.ExportRoutes.splice(target.ExportRoutes.indexOf(r2), 1);
            break;
          }
        }
        TotalExports--;
        return;
      }
    }
    let route = new TradeRoute(this, target, good, 1);
    this.ExportRoutes.push(route);
    target.ImportRoutes.push(route);
    TotalExports++;

    return;
  }

  public AttemptBuildHouse(): boolean {
    if (this.population < 1) {
      this.population++;
      this.IncreaseProduction();
      return true;
    }
    var need = Needs.Create(WOOD)
      .Add(FOOD)
      .AddIf(this.population > 5, STONE);

    if (
      !this.MeetsNeeds(need) &&
      !(options.auto_import && this.AttemptImportNeeds(need))
    ) {
      return false;
    }
    this.UseResources(need);

    this.population++;
    this.IncreaseProduction();
    return true;

    return false;
  }

  public AttemptImportNeeds(n: Needs): boolean {
    let nextInPath = new Map();
    let workingSet: City[] = [];

    this.neighbors.forEach((n) => {
      workingSet.push(n);
    });
    workingSet.forEach((n) => {
      nextInPath.set(n, this);
    });
    let visited = new Set();
    let needsLeft = n.CreateCopy();
    for (let i of needsLeft.Items) {
      i.Amount -= this.goodsProduction[i.Good];
      i.Amount = Math.max(0, i.Amount);
    }
    while (workingSet.length > 0) {
      let current = workingSet.shift()!;
      if (visited.has(current)) continue;
      if (current.population < 1) continue;
      visited.add(current);
      for (let nn of current.neighbors) {
        if (nn == this) continue;
        if (nn.population < 1) continue;
        if (!nn.discovered) continue;
        if (visited.has(nn)) continue;

        workingSet.push(nn);
        nextInPath.set(nn, current);
      }

      needsLeft.Items.forEach((i) => {
        while (i.Amount > 0 && current.goodsProduction[i.Good] > 0) {
          let c = current;
          while (c != this) {
            let parent = nextInPath.get(c)!;
            c.MustExport(i.Good, parent);
            c = parent;
          }
          i.Amount--;
        }
      });

      if (needsLeft.Items.every((i) => i.Amount == 0)) {
        return true;
      }
    }

    return false;
  }

  public UseResources(n: Needs) {
    for (let i of n.Items) {
      this.goodsProduction[i.Good] -= i.Amount;
    }
  }

  public MeetsNeeds(n: Needs): boolean {
    for (let i of n.Items) {
      if (this.goodsProduction[i.Good] < i.Amount) {
        return false;
      }
    }
    return true;
  }
}
export class Lane {
  public distance: number = this.start.location.distanceTo(this.end.location);
  public IsLong(): boolean {
    return this.distance > 150;
  }
  constructor(public start: City, public end: City) {}
}

class Quant {
  public Good: number;
  public Amount: number;
  constructor(good: number, amount: number) {
    this.Good = good;
    this.Amount = amount;
  }
}
class Needs {
  public Items: Quant[] = new Array();
  public static Create(good: number, amount: number = 1): Needs {
    let n = new Needs();
    n.Items.push(new Quant(good, amount));
    return n;
  }
  public Add(good: number, amount: number = 1): Needs {
    this.Items.push(new Quant(good, amount));
    return this;
  }
  public AddIf(condition: boolean, good: number, amount: number = 1): Needs {
    if (condition) {
      return this.Add(good, amount);
    }
    return this;
  }

  public CreateCopy(): Needs {
    let n = new Needs();
    for (let i of this.Items) {
      n.Items.push(new Quant(i.Good, i.Amount));
    }
    return n;
  }
}

export enum NodeType {
  Empty = 0,
  Forest = 1,
  Plains = 2,
  Stone = 3,
}

export class Ship {
  public loaded: boolean = false;
  public loadCost: number = 0;
  public cash: number = 0;
  public isPlayer: boolean = false;
  constructor(
    public name: string,
    public id: number,

    public location: Coord,
    public dockedCity: City | null,
    public targetCity: City | null
  ) {
    this.location = new Coord(location.x, location.y);
  }
  static CreateShip(name: string, city: City): Ship {
    //create random id
    // random number between 0 and 1000000
    const id = Math.floor(Math.random() * 1000000);
    return new Ship(name, id, city.location, city, null);
  }
}

export function CreateNodes(
  nodeCount: number,
  radius: number,
  citySpacing: number
): { cities: City[]; lanes: Lane[] } {
  let cities: City[] = [];
  for (let i = 0; i < nodeCount; i++) {
    let pick = Math.random();
    let type = NodeType.Forest;
    if (pick < 0.33) {
      type = NodeType.Plains;
    } else if (pick < 0.66) {
      type = NodeType.Stone;
    }
    let n = new City(i.toString(), i, getRandomPointInsideCircle(radius), type);
    cities.push(n);
  }
  for (let i = 0; i < 20; i++) {
    pushNodesApart(cities, citySpacing);
  }

  // order nodes by x position
  cities.sort((a, b) => a.location.x - b.location.x);
  // set node names and ids to match their index in the array
  for (let i = 0; i < cities.length; i++) {
    cities[i].name = CityNames[i];
    cities[i].id = i;
  }

  let lanes: Lane[] = new Array();

  for (let i = 0; i < cities.length; i++) {
    let nodeA = cities[i];
    for (let j = i + 1; j < cities.length; j++) {
      let nodeB = cities[j];
      let distance = nodeA.location.distanceTo(nodeB.location);
      if (distance < 300) {
        let lane = new Lane(nodeA, nodeB);
        lanes.push(lane);
        if (!lane.IsLong()) {
          nodeA.neighbors.push(nodeB);
          nodeB.neighbors.push(nodeA);
        } else {
          nodeA.longNeighbors.push(nodeB);
          nodeB.longNeighbors.push(nodeA);
        }
      }
    }
  }

  return { cities, lanes };
}

function pushNodesApart(nodes: City[], minDistance: number) {
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
