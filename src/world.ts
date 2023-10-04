import { CityNames } from "./cityNames.js";
import { Coord, getRandomPointInsideCircle } from "./utils.js";
const NUM_GOODS = 5;
export const GoodsNames = ["Wood", "Stone", "Iron", "Gold", "Food"];

export class City {
  public prices: number[] = new Array(NUM_GOODS).fill(0);
  public goodCount: number = 0;
  public goodPrice: number = 50;
  public population: number = 0;
  public maxPopulation: number = 15;
  public growthRate: number = 0.1;
  public neighbors: City[] = [];
  public attractiveness(): number {
    return this.goodCount;
  }
  constructor(
    public name: string,
    public id: number,

    public location: Coord,

    public type: NodeType
  ) {
    // create random prices for each good
    for (let i = 0; i < NUM_GOODS; i++) {
      this.prices[i] = Math.floor(Math.random() * 100);
    }
    this.growthRate = 0.1 + Math.random() * 0.2;
    this.maxPopulation = 3 + Math.floor(Math.random() * 12);
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

export function AdvanceTurn(cities: City[], ships: Ship[]) {
  const ODDS_WANDERLUST = 10;
  const ODDS_BABY = 10;
  const ODDS_MERCHANT = ODDS_BABY + 20;

  // console.log("Advancing turn");
  // update each city

  let commands = [];
  for (let c of cities) {
    for (let i = 0; i < c.population; i++) {
      // simulate each citizen
      // pick number betwen 1 and 100
      let num = Math.floor(Math.random() * 100);
      if (num < ODDS_WANDERLUST) {
        // citizen wants to move
        // pick a random neighbor
        let neighbor =
          c.neighbors[Math.floor(Math.random() * c.neighbors.length)];
        // pick most attractive neighbor
        for (let n of c.neighbors) {
          if (n.attractiveness() > neighbor.attractiveness()) {
            neighbor = n;
          }
        }
        if (neighbor.population < neighbor.maxPopulation) {
          // move citizen to neighbor
          c.population--;
          commands.push(() => {
            let n = neighbor;
            n.population++;
          });
        }
      } else if (num < ODDS_BABY) {
        // citizen wants to have a baby
        if (c.population < c.maxPopulation && c.population >= 2) {
          // have a baby
          commands.push(() => {
            let cit = c;
            cit.population++;
          });
        }
      } else if (num < ODDS_MERCHANT) {
        // pick a random city with less goods than current city move goods to that city
        let neighbor =
          c.neighbors[Math.floor(Math.random() * c.neighbors.length)];
        // pick most attractive neighbor
        for (let n of c.neighbors) {
          if (n.goodCount < neighbor.goodCount) {
            neighbor = n;
          }
        }
        if (neighbor.goodCount < c.goodCount) {
          // move goods to neighbor
          c.goodCount--;

          commands.push(() => {
            let n = neighbor;
            n.goodCount++;
          });
        }
      }
    }
  }
  // run all the commands
  for (let c of commands) {
    c();
  }
}
