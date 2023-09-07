import { CityNames } from "./cityNames.js";
import { Coord, getRandomPointInsideCircle } from "./utils.js";

export class City {
  constructor(
    public name: string,
    public id: number,

    public location: Coord,
    public type: NodeType
  ) {}
}

export enum NodeType {
  Empty = 0,
  Mine = 1,
  Factory = 2,
  Market = 3,
}

export function CreateNodes(nodeCount: number, radius: number): City[] {
  let nodes: City[] = [];
  for (let i = 0; i < nodeCount; i++) {
    let n = new City(
      i.toString(),
      i,
      getRandomPointInsideCircle(radius),
      Math.random() < 0.7 ? NodeType.Mine : NodeType.Factory
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

export class Ship {
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

export function AdvanceTurn(cities: City[], ships: Ship[]) {
  // console.log("Advancing turn");
  for (let s of ships) {
    if (s.targetCity != null) {
      if (s.location.distanceTo(s.targetCity.location) < 25) {
        s.dockedCity = s.targetCity;
        s.targetCity = null;
      } else {
        s.dockedCity = null;
        const delta = s.targetCity.location.subtract(s.location).normalized();

        const speed = 20;
        s.location = s.location.add(delta.scale(speed));
      }
    }
  }
}
