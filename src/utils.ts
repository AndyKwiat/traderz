export class Coord {
  constructor(public x: number, public y: number) {}
  public distanceTo(other: Coord): number {
    const deltaX = this.x - other.x;
    const deltaY = this.y - other.y;
    return Math.sqrt(deltaX ** 2 + deltaY ** 2);
  }
  public distanceSq(other: Coord): number {
    const deltaX = this.x - other.x;
    const deltaY = this.y - other.y;
    return deltaX ** 2 + deltaY ** 2;
  }

  public add(other: Coord): Coord {
    return new Coord(this.x + other.x, this.y + other.y);
  }

  public subtract(other: Coord): Coord {
    return new Coord(this.x - other.x, this.y - other.y);
  }
  public length(): number {
    return Math.sqrt(this.x ** 2 + this.y ** 2);
  }
  public scale(factor: number): Coord {
    return new Coord(this.x * factor, this.y * factor);
  }
  public normalized(): Coord {
    const len = this.length();
    return new Coord(this.x / len, this.y / len);
  }
}

export function getRandomPointInsideCircle(radius: number): Coord {
  const angle = Math.random() * 2 * Math.PI; // random angle between 0 and 2π
  const randomRadius = Math.sqrt(Math.random()) * radius; // random radius between 0 and the given radius
  const x = randomRadius * Math.cos(angle); // calculate x-coordinate
  const y = randomRadius * Math.sin(angle); // calculate y-coordinate
  return new Coord(x, y);
}
