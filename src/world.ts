import { CityNames } from "./cityNames.js";
import { Coord, getRandomPointInsideCircle } from "./utils.js";
const NUM_GOODS = 3;
const WOOD = 0;
const STONE = 1;
const FOOD = 2;
export const GoodsNames = ["🪵", "🪨", "🌾"];
class TradeRoute {
  constructor(
    public start: City,
    public end: City,
    public goodType: number,
    public amount: number
  ) {}
}
export class City {
  public potentialGoodsProduction: number[] = new Array(NUM_GOODS).fill(0);
  public goodsProduction: number[] = new Array(NUM_GOODS).fill(0);

  public ExportRoutes: TradeRoute[] = [];
  public ImportRoutes: TradeRoute[] = [];

  public population: number = 0;

  public neighbors: City[] = [];

  constructor(
    public name: string,
    public id: number,

    public location: Coord,

    public type: NodeType
  ) {}
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
  public AttemptExport(good: number, target: City): boolean {
    if (this.goodsProduction[good] <= 0) {
      return false;
    }
    this.goodsProduction[good]--;
    let route = new TradeRoute(this, target, good, 1);
    this.ExportRoutes.push(route);
    target.ImportRoutes.push(route);
    target.goodsProduction[good]++;

    return true;
  }
  public AttemptBuildHouse(): boolean {
    if (this.population < 1) {
      this.population++;
      this.IncreaseProduction();
      return true;
    }
    if (this.goodsProduction[WOOD] <= 0) {
      return false;
    }
    let needFood = false;
    if (this.population >= 3) {
      needFood = true;
    }

    if (needFood && this.goodsProduction[FOOD] <= 0) {
      return false;
    }

    this.goodsProduction[WOOD]--;
    if (needFood) {
      this.goodsProduction[FOOD]--;
    }
    this.population++;
    this.IncreaseProduction();
    return true;

    return false;
  }
}
export class Lane {
  constructor(public start: City, public end: City) {}
}

export enum NodeType {
  Empty = 0,
  Forest = 1,
  Plains = 2,
  Stone = 3,
  Mine = 4,
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
  radius: number
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
    pushNodesApart(cities, 80);
  }

  // order nodes by x position
  cities.sort((a, b) => a.location.x - b.location.x);
  // set node names and ids to match their index in the array
  for (let i = 0; i < cities.length; i++) {
    cities[i].name = CityNames[i];
    cities[i].id = i;
  }

  let lanes: Lane[] = new Array();
  // for every node, see the closest 4 nodes and add a lane if it doesn't already exist
  for (let i = 0; i < cities.length; i++) {
    let nodeA = cities[i];
    for (let j = i + 1; j < cities.length; j++) {
      let nodeB = cities[j];
      let distance = nodeA.location.distanceTo(nodeB.location);
      if (distance < 150) {
        let lane = new Lane(nodeA, nodeB);
        lanes.push(lane);
        nodeA.neighbors.push(nodeB);
        nodeB.neighbors.push(nodeA);
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
