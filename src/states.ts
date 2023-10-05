import { City, GoodsNames } from "./world.js";

abstract class State {
  Message: string = "---";
  OnCityClicked(city: City) {}
  OnCityGoodsBoxClicked(city: City, good: number) {}
  EscapeClicked(): void {}
}

function SetState(state: State) {
  CurState = state;
  redraw();
}
class BuildHouses extends State {
  Message: string = "Click on a city to build a house";
  OnCityClicked(city: City): void {
    city.AttemptBuildHouse();
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
  OnCityClicked(city: City): void {
    this.startCity.AttemptExport(this.goodToExport, city);
    redraw();
    // this.city.SetExportTarget(this.good, city);
    // SetState( new BuildHouses() );
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
