import { CityNames } from "./cityNames.js";
import { Coord, getRandomPointInsideCircle } from "./utils.js";
const NUM_GOODS = 5;
export const GoodsNames = ["Wood", "Stone", "Iron", "Gold", "Food"];

export class City {
  public prices: number[] = new Array(NUM_GOODS).fill(0);
  public goodCount: number = 50;
  public goodPrice: number = 50;
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
  }
}

export enum NodeType {
  Empty = 0,
  Mine = 1,
  Factory = 2,
  Market = 3,
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

export function CreateNodes(nodeCount: number, radius: number): City[] {
  let nodes: City[] = [];
  for (let i = 0; i < nodeCount; i++) {
    let n = new City(
      i.toString(),
      i,
      getRandomPointInsideCircle(radius),
      Math.random() < 0.5 ? NodeType.Factory : NodeType.Market
    );
    nodes.push(n);
  }
  for (let i = 0; i < 20; i++) {
    pushNodesApart(nodes, 80);
  }

  // order nodes by x position
  nodes.sort((a, b) => a.location.x - b.location.x);
  // set node names and ids to match their index in the array
  for (let i = 0; i < nodes.length; i++) {
    nodes[i].name = CityNames[i];
    nodes[i].id = i;
  }

  return nodes;
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
  // console.log("Advancing turn");
  for (let s of ships) {
    if (s.targetCity != null) {
      if (s.location.distanceTo(s.targetCity.location) < 25) {
        s.dockedCity = s.targetCity;
        s.targetCity = null;
        if (s.dockedCity.type == NodeType.Market) {
          if (s.loaded && s.dockedCity.goodPrice > s.loadCost) {
            s.dockedCity.goodCount += 10;
            s.loaded = false;
            s.cash += s.dockedCity.goodPrice * 10;
            s.loadCost = 0;
          }
        }
        if (s.dockedCity.type == NodeType.Factory) {
          if (!s.loaded) {
            s.dockedCity.goodCount -= 10;
            s.loaded = true;
            s.loadCost = s.dockedCity.goodPrice;
            s.cash -= s.dockedCity.goodPrice * 10;
          }
        }
      } else {
        s.dockedCity = null;
        const delta = s.targetCity.location.subtract(s.location).normalized();

        const speed = 20;
        s.location = s.location.add(delta.scale(speed));
      }
    }
    if (s.dockedCity != null && !s.isPlayer) {
      pickNextTarget(s, cities);
    }
  }

  let totalPriceMarket = 0;
  let minPriceMarket = 101;
  let maxPriceMarket = -1;
  let totalPriceFactory = 0;
  let minPriceFactory = 101;
  let maxPriceFactory = -1;
  for (let c of cities) {
    // update goodPrice
    let expectedPrice = 100 - c.goodCount;
    c.goodPrice = c.goodPrice * 0.9 + expectedPrice * 0.1;
    c.goodPrice = Math.min(c.goodPrice, 100);
    if (c.type == NodeType.Market) {
      c.goodCount -= (0.5 * (120 - c.goodPrice)) / 100;
      totalPriceMarket += c.goodPrice;
      minPriceMarket = Math.min(minPriceMarket, c.goodPrice);
      maxPriceMarket = Math.max(maxPriceMarket, c.goodPrice);
    }
    if (c.type == NodeType.Factory) {
      c.goodCount += 0.07;
      totalPriceFactory += c.goodPrice;
      minPriceFactory = Math.min(minPriceFactory, c.goodPrice);
      maxPriceFactory = Math.max(maxPriceFactory, c.goodPrice);
    }
    c.goodCount = Math.max(c.goodCount, 0);
  }
  return {
    avgPriceMarket: Math.floor(totalPriceMarket / cities.length),
    minPriceMarket: Math.floor(minPriceMarket),
    maxPriceMarket: Math.floor(maxPriceMarket),
    avgPriceFactory: Math.floor(totalPriceFactory / cities.length),
    minPriceFactory: Math.floor(minPriceFactory),
    maxPriceFactory: Math.floor(maxPriceFactory),
  };
}

function pickNextTarget(s: Ship, cities: City[]) {
  // pick a city based on distance and price of goods combined in a formula
  let bestCity: City | null = null;
  let bestScore = 0;
  let targetType = NodeType.Factory;
  let priceScale = -1;
  if (s.loaded) {
    targetType = NodeType.Market;
    priceScale = 1.0;
  }
  for (let c of cities) {
    if (c == s.dockedCity) {
      continue;
    }
    if (c.type == targetType) {
      const distance = c.location.distanceTo(s.location);
      const price = c.goodPrice * priceScale;
      const score = price - distance * 0.15 + Math.random() * 5;
      if (score > bestScore || bestCity == null) {
        bestScore = score;
        bestCity = c;
      }
    }
  }
  if (bestCity != null) {
    s.targetCity = bestCity;
  }
}
