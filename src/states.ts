import { City, GoodsNames, WOOD, STONE, FOOD } from "./world";
import { options } from "./app";
let LargeLoadScalar = () => (options.LargeLoads ? 10 : 1);
abstract class State {
  Message: string = "---";
  OnCityClicked(city: City) {}
  OnCityGoodsBoxClicked(city: City, good: number) {}
  EscapeClicked(): void {}
  OnPortButtonClicked(): void {
    SetState(new BuildPort());
  }

  OnWorkshopButtonClicked(): void {
    SetState(new BuildWorkshop());
  }
}

function SetState(state: State) {
  CurState = state;
  redraw();
}

class BuildPort extends State {
  Message: string = "Click on a city to build a port";
  OnCityClicked(city: City): void {
    if (!city.discovered) return;
    if (city.population < 1) return;
    if (city.AttemptBuildPort()) {
      SetState(new BuildHouses());
    }
    redraw();
  }
  EscapeClicked(): void {
    SetState(new BuildHouses());
  }
}
class BuildWorkshop extends State {
  Message: string = "Click on a city to build a workshop";
  OnCityClicked(city: City): void {
    if (!city.discovered) return;
    if (city.population < 1) return;
    city.AttemptBuildWorkshop();
    redraw();
  }
  EscapeClicked(): void {
    SetState(new BuildHouses());
  }
}
class BuildHouses extends State {
  Message: string = "Click on a city to build a house";
  OnCityClicked(city: City): void {
    if (!city.discovered) return;
    let built = false;
    for (let i = 0; i < LargeLoadScalar(); i++) {
      if (i == 1 && city.population == 1) break;
      if (i > 0 && city.primaryGoodsCount() < 2) {
        break;
      }
      if (city.AttemptUseTools()) {
        continue;
      }
      built = city.AttemptBuildHouse() || built;
    }
    if (built) {
      for (let neighbor of city.neighbors) {
        neighbor.discovered = true;
        neighbor.seen = true;
      }
      for (let ln of city.longNeighbors) {
        ln.seen = true;
      }
    }
    redraw();
  }
  OnCityGoodsBoxClicked(city: City, good: number): void {
    SetState(new PickExportTarget(city, good));
  }
}

class PickExportTarget extends State {
  Message: string = `Click on a city to export ${
    GoodsNames[this.goodToExport]
  } from ${this.startCity.name}`;
  constructor(private startCity: City, private goodToExport: number) {
    super();
  }
  private lastClickedCity: City | null = null;
  OnCityClicked(city: City): void {
    if (city.population < 1) {
      this.lastClickedCity = null;
      return;
    }
    if (
      this.lastClickedCity != null &&
      !this.startCity.hasNeighbor(city) &&
      this.lastClickedCity.hasNeighbor(city)
    ) {
      this.startCity = this.lastClickedCity;
      this.OnCityClicked(city);
      return;
    }
    if (!this.startCity.hasNeighbor(city)) {
      return;
    }

    for (let i = 0; i < LargeLoadScalar(); i++) {
      if (this.startCity.goodsProduction[this.goodToExport] <= 0) {
        break;
      }
      this.startCity.AttemptExport(this.goodToExport, city);
    }
    redraw();
    this.lastClickedCity = city;
  }
  OnCityGoodsBoxClicked(city: City, good: number): void {
    SetState(new PickExportTarget(city, good));
  }
  EscapeClicked(): void {
    SetState(new BuildHouses());
  }
}
function redraw() {
  RedrawFunc?.();
}
export function SetRedrawFunc(func: Function) {
  RedrawFunc = func;
}

let RedrawFunc: Function | null;
export let CurState: State = new BuildHouses();
