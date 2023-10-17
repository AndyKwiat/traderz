import {
  CreateNodes,
  NodeType,
  City,
  Ship,
  GoodsNames,
  TotalExports,
} from "./world";
import { CurState, SetRedrawFunc } from "./states";
import { Coord } from "./utils";
import { List } from "linqts";

const CITY_COUNT = 60;
const AREA_RADIUS = 650;
const MIN_CITY_SPACING = 50;
const NUM_SHIPS = 0;
const NODE_RADIUS = 10;

SetRedrawFunc(() => {
  let numGoods = GoodsNames.length;
  let goodTotals = new Array(numGoods).fill(0);
  let pop = 0;
  for (let c = 0; c < cities.length; c++) {
    pop += cities[c].population;
    for (let i = 0; i < numGoods; i++) {
      goodTotals[i] += cities[c].goodsProduction[i];
    }
  }
  for (let i = 0; i < numGoods; i++) {
    updateStatus(GoodsNames[i], goodTotals[i].toString());
  }
  updateStatus("TotalExports", TotalExports.toString());
  updateStatus("Population", pop.toString());
  let cityCount = linq.Where((c) => c!.population > 0).Count();
  updateStatus("CityCount", cityCount.toString());
  // use linq to pick cities with population > 5 and add up their population
  let cash = linq
    .Where((c) => c!.population > 5)
    .Select((c) => c!.population - 5)
    .Sum();
  cash += linq
    .Where((c) => c!.population > 10)
    .Select((c) => c!.population - 10)
    .Sum();
  cash *= 10;
  cash -= cityCount * 5;
  cash -= TotalExports;
  updateStatus("Cash", cash.toString());
  updateStatus("ScoreDiv", ((pop * 100) / TotalExports).toFixed(0).toString());
  updateStatus("ScoreSub", (pop * 100 - TotalExports).toString());

  redraw();
});
class TriggerBox {
  constructor(
    public x: number,
    public y: number,
    public width: number,
    public height: number,

    public callback: Function | null
  ) {}
}
let TriggerBoxes: TriggerBox[] = [];

// Set up the canvas
const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const messageBox = document.getElementById("message")!;

const renderContext = canvas.getContext("2d")!;

let curNode: City | null;
// Initialize variables for panning and scaling
let panX = canvas.width / 2;
let panY = canvas.height / 2;
let scale = 1;

let { cities, lanes } = CreateNodes(CITY_COUNT, AREA_RADIUS, MIN_CITY_SPACING);

cities[Math.floor(CITY_COUNT / 2)].discovered = true;
let linq = new List<City>(cities);
let ships: Ship[] = [];
// ships.push(Ship.CreateShip("Laska", cities[CITY_COUNT / 2]));
// for (let i = 0; i < NUM_SHIPS - 1; i++) {
//   ships.push(
//     Ship.CreateShip(
//       "Laska" + i.toString(),
//       cities[Math.floor(i + NUM_SHIPS / 2) % cities.length]
//     )
//   );
// }
let stats: object;
// ships[0].isPlayer = true;
// // console.log("shipping the ship");
// const shipImg = new Image();
// shipImg.src = "shipblue.png";
// let imageLoaded = false;
// const shipImgCPU = new Image();
// shipImgCPU.src = "ship.png";
// let imageLoadedCPU = false;
// shipImg.onload = () => {
//   imageLoaded = true;
// };
// shipImgCPU.onload = () => {
//   imageLoadedCPU = true;
// };

document.addEventListener("keydown", (event: KeyboardEvent) => {
  if (event.key === " ") {
    console.log("space bar pressed");
    //
    //AdvanceTurn(cities, ships);
    redraw();
  }
  if (event.key === "Escape") {
    CurState.EscapeClicked();
    updateStateMessage();
  }
});

class Options {
  public auto_import: boolean = true;
  public LargeLoads: boolean = true;
}

export const options = new Options();
setupOption(
  "auto_import-checkbox",
  () => options.auto_import,
  (v) => (options.auto_import = v)
);
setupOption(
  "large-loads-checkbox",
  () => options.LargeLoads,
  (v) => (options.LargeLoads = v)
);
function setupOption(
  name: string,
  getter: () => boolean,
  setter: (value: boolean) => void
) {
  const checkbox = document.getElementById(name) as HTMLInputElement;

  checkbox.checked = getter();
  checkbox.addEventListener("change", function () {
    setter(this.checked);
  });
}

export let LargeLoads = true;

// Function to handle mouse wheel event for scaling
canvas.addEventListener("wheel", (event) => {
  // Calculate the new scale based on the wheel event
  const deltaY = event.deltaY;
  const scaleFactor = Math.sign(deltaY) > 0 ? 0.97 : 1.03;
  scale *= scaleFactor;

  // Calculate the position of the mouse relative to the canvas
  const rect = canvas.getBoundingClientRect();
  const mouseX = event.clientX - rect.left;
  const mouseY = event.clientY - rect.top;

  // Update the pan coordinates based on the zooming around the mouse
  panX -= (mouseX / scale) * (scaleFactor - 1);
  panY -= (mouseY / scale) * (scaleFactor - 1);

  // Call the redraw function to update the canvas
  redraw();
});
const cityHoverMenu = document.getElementById(
  "city-hover-menu"
) as HTMLDivElement;
const cityHoverMenuTitle = cityHoverMenu.querySelector(
  "#city-hover-menu-title"
) as HTMLDivElement;
// add divs for each good
const cityHoverMenuGoods = cityHoverMenu.querySelector(
  "#city-hover-menu-goods"
) as HTMLDivElement;
for (let i = 0; i < GoodsNames.length; i++) {
  let div = document.createElement("div");
  div.innerHTML = GoodsNames[i];
  cityHoverMenuGoods.appendChild(div);
  div.style.display = "inline-block";
  div.style.width = "50%";
  div = document.createElement("div");
  div.innerHTML = "0";
  cityHoverMenuGoods.appendChild(div);
  div.style.display = "inline-block";
  div.style.width = "50%";
  div.setAttribute("id", "city-hover-menu-goods-count-" + i.toString());
}

// Function to handle mouse move event for panning
canvas.addEventListener("mousemove", (event) => {
  // Check if the left mouse button is pressed
  if (event.buttons === 1) {
    // Update the pan coordinates based on the mouse movement
    panX += event.movementX / scale;
    panY += event.movementY / scale;

    // Call the redraw function to update the canvas
    redraw();
  }
});

const NODE_OFFSET = new Coord(-NODE_RADIUS, -NODE_RADIUS);
export function redraw() {
  TriggerBoxes = [];
  /// draw blue background
  renderContext.fillStyle = "lightblue";
  renderContext.fillRect(0, 0, canvas.width, canvas.height);
  // Save the current transformation state
  renderContext.save();
  // Apply the panning and scaling transformations
  renderContext.scale(scale, scale);
  renderContext.translate(panX, panY);

  // draw the lanes
  renderContext.setLineDash([5, 5]);
  // make the line grey with transparency

  renderContext.lineWidth = 1;

  for (let j = 0; j < lanes.length; j++) {
    let lane = lanes[j];
    // if both are not discovered don't show
    if (!lanes[j].start.discovered || !lanes[j].end.discovered) continue;
    // if both have no population don't show
    if (lanes[j].start.population <= 0 && lanes[j].end.population <= 0)
      continue;
    if (lane.IsLong() && !(lane.start.hasPort || lane.end.hasPort)) continue;

    // if there's an import route between the start and end cities don't draw the lane
    let skip = false;
    for (let i = 0; i < lanes[j].start.ImportRoutes.length; i++) {
      if (lanes[j].start.ImportRoutes[i].start == lanes[j].end) {
        skip = true;
        break;
      }
    }
    if (skip) continue;
    for (let i = 0; i < lanes[j].start.ExportRoutes.length; i++) {
      if (lanes[j].start.ExportRoutes[i].end == lanes[j].end) {
        skip = true;
        break;
      }
    }
    if (skip) continue;
    renderContext.strokeStyle = "rgba(0,0,0,0.4)";
    if (lane.IsLong()) {
      renderContext.strokeStyle = "rgba(255,50,0,0.6)";
    }
    renderContext.beginPath();
    renderContext.moveTo(lanes[j].start.location.x, lanes[j].start.location.y);
    renderContext.lineTo(lanes[j].end.location.x, lanes[j].end.location.y);
    // make the line dotted

    // make the line light grey

    renderContext.stroke();
  }

  drawCities();

  // draw ships
  for (let i = 0; i < ships.length; i++) {
    let loc = ships[i].location;

    if (ships[i].dockedCity != null) {
      loc = ships[i].dockedCity!.location.add(NODE_OFFSET);
    }
    // if (imageLoaded && ships[i].isPlayer) {
    //   renderContext.drawImage(shipImg, loc.x - 10, loc.y - 10, 20, 20);
    // }
    // if (imageLoadedCPU && !ships[i].isPlayer) {
    //   renderContext.drawImage(shipImgCPU, loc.x - 10, loc.y - 10, 20, 20);
    // }
    if (ships[i].targetCity != null) {
      renderContext.beginPath();
      renderContext.moveTo(loc.x, loc.y);
      renderContext.lineTo(
        ships[i].targetCity!.location.x,
        ships[i].targetCity!.location.y
      );
      renderContext.lineWidth = 2;
      // make dotted line
      renderContext.setLineDash([5, 5]);
      renderContext.stroke();
    }
    // draw ship cash count below the ship
    renderContext.fillStyle = "yellow";
    renderContext.font = "28px Arial";
    renderContext.textAlign = "center";
    renderContext.textBaseline = "top";
    renderContext.fillText(
      "$" + Math.floor(ships[i].cash).toString(),
      loc.x,
      loc.y + NODE_RADIUS,
      NODE_RADIUS * 25
    );
  }

  // Restore the transformation state
  renderContext.restore();
}

function loop() {
  // if (ships[0].targetCity != null || nonStopTurn) {
  //   let stats = AdvanceTurn(cities, ships);
  //   // console.log(
  //   //   `market: ${stats.avgPriceMarket}, factory: ${stats.avgPriceFactory}`
  //   // );
  //   redraw();
  // }
  // setTimeout(loop, 50);
}
loop();

function coordToNode(nodes: City[], spot: Coord): City | null {
  const RAD_SQ = NODE_RADIUS * NODE_RADIUS; // little extra padding
  let foundNode = null;
  nodes.forEach((node: City) => {
    if (node.location.distanceSq(spot) <= RAD_SQ) {
      foundNode = node;
      return;
    }
  });

  return foundNode;
}
cityHoverMenu!.style.display = "none";
let lastHoveredNode: City | null = null;
canvas.addEventListener("mousemove", (event) => {
  return; // no hover menu for now
  const rect = canvas.getBoundingClientRect(); // Get the canvas position
  const x = event.clientX - rect.left; // Calculate the x-coordinate of the click relative to the canvas
  const y = event.clientY - rect.top; // Calculate the y-coordinate of the click relative to the canvas
  const worldX = x / scale - panX;
  const worldY = y / scale - panY;
  let foundNode = coordToNode(cities, new Coord(worldX, worldY));

  if (foundNode != null) {
    if (foundNode != lastHoveredNode) {
      lastHoveredNode = foundNode;
      messageBox.innerHTML = foundNode!.name;

      curNode = foundNode;
      cityHoverMenuTitle.innerHTML = foundNode!.name;
      cityHoverMenu.style.display = "block";
      cityHoverMenu.style.left = event.clientX + NODE_RADIUS + "px";
      cityHoverMenu.style.top = event.clientY + NODE_RADIUS + "px";
      // for (let i = 0; i < curNode!.prices.length; i++) {
      //   let div = document.getElementById(
      //     "city-hover-menu-goods-count-" + i.toString()
      //   )!;
      //   div.innerHTML = curNode!.prices[i].toString();
      // }
    }
  } else {
    lastHoveredNode = null;
    cityHoverMenu!.style.display = "none";

    messageBox.innerHTML = "";
    curNode = null;
  }
  // redraw();
});

function updateStateMessage() {
  messageBox.innerHTML = CurState.Message;
}

let status: { [key: string]: string } = {};
function updateStatus(key: string, value: string) {
  status[key] = value;
  let str = "";
  for (let key in status) {
    str += key + ": " + status[key] + "  ";
  }
  document.getElementById("status-message")!.innerHTML = str;
}
// add onclick to port button
document.getElementById("port-button")!.onclick = OnPortButtonClicked;
document.getElementById("workshop-button")!.onclick = OnWorkshopButtonClicked;

function OnPortButtonClicked() {
  CurState.OnPortButtonClicked();
  updateStateMessage();
}

function OnWorkshopButtonClicked() {
  CurState.OnWorkshopButtonClicked();
  updateStateMessage();
}

function OnCityGoodsBoxClicked(city: City, good: number) {
  CurState.OnCityGoodsBoxClicked(city, good);
  updateStateMessage();
}

function OnCityClicked(clickedCity: City) {
  CurState.OnCityClicked(clickedCity);
  updateStateMessage();
}
function handleClick(event: any) {
  const canvas = event.target; // Get the canvas element

  const rect = canvas.getBoundingClientRect(); // Get the canvas position

  const x = event.clientX - rect.left; // Calculate the x-coordinate of the click relative to the canvas
  const y = event.clientY - rect.top; // Calculate the y-coordinate of the click relative to the canvas

  const worldX = x / scale - panX;
  const worldY = y / scale - panY;

  // check intersection with trigger boxes
  for (let i = 0; i < TriggerBoxes.length; i++) {
    if (
      TriggerBoxes[i].x <= worldX &&
      TriggerBoxes[i].x + TriggerBoxes[i].width >= worldX &&
      TriggerBoxes[i].y <= worldY &&
      TriggerBoxes[i].y + TriggerBoxes[i].height >= worldY
    ) {
      if (TriggerBoxes[i].callback != null) {
        TriggerBoxes[i].callback!();
        return;
      }
    }
  }

  let clickedCity = coordToNode(cities, new Coord(worldX, worldY));
  if (clickedCity != null) {
    OnCityClicked(clickedCity);
  } else {
    CurState.EscapeClicked();
    updateStateMessage();
  }
}

canvas.addEventListener("click", handleClick);

redraw();

function drawCities() {
  // draw cities
  renderContext.fillStyle = "rgba(255,255,0,0.5)";
  renderContext.strokeStyle = "black";
  renderContext.setLineDash([0, 0]);

  for (let i = 0; i < cities.length; i++) {
    let city = cities[i];
    renderContext.beginPath();
    renderContext.arc(
      cities[i].location.x,
      cities[i].location.y,
      NODE_RADIUS,
      0,
      2 * Math.PI
    );

    let clr = "white";
    if (city.discovered) {
      switch (city.type) {
        case NodeType.Forest:
          clr = "green";
          break;
        case NodeType.Plains:
          clr = "yellow";
          break;
        case NodeType.Stone:
          clr = "grey";
          break;
        case NodeType.Metal:
          clr = "cyan";
          break;
      }
    }

    renderContext.fillStyle = clr;
    renderContext.fill();
    if (cities[i] == curNode) {
      renderContext.lineWidth = 5;
    } else {
      renderContext.lineWidth = 2;
    }
    renderContext.stroke();

    if (city.population > 0) {
      // draw the node name below the circle
      renderContext.fillStyle = "black";
      renderContext.font = "14px Arial";
      renderContext.textAlign = "center";
      renderContext.textBaseline = "top";
      renderContext.fillText(
        cities[i].name,
        cities[i].location.x,
        cities[i].location.y + NODE_RADIUS,
        NODE_RADIUS * 25
      );
    }
    // draw good count above city
    renderContext.fillStyle = "black";
    renderContext.font = "10px Arial";
    renderContext.textAlign = "center";
    renderContext.textBaseline = "bottom";
    var showGood = (gn: number, x: number, y: number) => {
      if (city.goodsProduction[gn] <= 0) return;
      let cx = cities[i].location.x + NODE_RADIUS * x;
      // gotta separate the text so the spacing is better
      renderContext.fillText(
        GoodsNames[gn],
        cx,
        cities[i].location.y + NODE_RADIUS * y,
        NODE_RADIUS * 25
      );
      renderContext.fillText(
        cities[i].goodsProduction[gn].toString(),
        cx + 7,
        cities[i].location.y + NODE_RADIUS * y,
        NODE_RADIUS * 25
      );
      // // draw rectangle around the text
      // renderContext.strokeRect(
      //   cx - 7,
      //   cities[i].location.y + NODE_RADIUS * y - 10,
      //   14,
      //   9
      // );
      TriggerBoxes.push(
        new TriggerBox(
          cx - 7,
          cities[i].location.y + NODE_RADIUS * y - 10,
          14,
          9,
          () => {
            OnCityGoodsBoxClicked(cities[i], gn);
          }
        )
      );
    };
    if (city.population > 0) {
      showGood(0, -2.1, -0.1);
      showGood(1, 0.8, -0.8);
      showGood(2, 1.7, 0.5);
      showGood(3, -2.1, 1.7);
      showGood(4, 1.2, 1.7);
    }
    if (city.hasPort) {
      renderContext.fillText(
        "⚓️",
        city.location.x + NODE_RADIUS * -1,
        city.location.y + NODE_RADIUS * -1,
        NODE_RADIUS * 2
      );
    }

    if (city.hasWorkshop) {
      renderContext.fillText(
        "🔥",
        city.location.x + NODE_RADIUS * +1,
        city.location.y + NODE_RADIUS * -1,
        NODE_RADIUS * 2
      );
    }

    renderContext.strokeStyle = "black";
    renderContext.setLineDash([5, 0]);
    renderContext.lineWidth = 0.25;
    renderContext.strokeStyle = "rgba(0,0,0,0.4)";
    // count how many export routes to each neighbor
    let exportCounts: { [key: number]: number } = {};
    for (let ex in city.ExportRoutes) {
      let route = city.ExportRoutes[ex];
      if (exportCounts[route.end.id] == undefined) {
        exportCounts[route.end.id] = 0;
      }
      exportCounts[route.end.id]++;
    }
    // draw an arrow for each neighbor with export route, and label the count
    for (let neighbor of city.neighbors) {
      if (exportCounts[neighbor.id] != undefined) {
        renderContext.lineWidth = 0.25 * exportCounts[neighbor.id];
        drawArrowBetweenCircles(
          renderContext,
          {
            x: city.location.x,
            y: city.location.y,
            radius: NODE_RADIUS,
          },
          {
            x: neighbor.location.x,
            y: neighbor.location.y,
            radius: NODE_RADIUS,
          },
          10,
          Math.PI / 8,
          3
        );
        // renderContext.fillText(
        //   exportCounts[neighbor.id].toString(),
        //   (city.location.x + neighbor.location.x) / 2,
        //   (city.location.y + neighbor.location.y) / 2,
        //   NODE_RADIUS * 25
        // );
      }
    }

    if (
      false && // turn this off for now
      (city.ImportRoutes.length > 0 || city.ExportRoutes.length > 0)
    ) {
      renderContext.fillText(
        `im-${cities[i].ImportRoutes.length} ex-${cities[i].ExportRoutes.length})`,
        cities[i].location.x + NODE_RADIUS,
        cities[i].location.y + NODE_RADIUS * 3,
        NODE_RADIUS * 25
      );
    }

    // draw the population  in center of circle
    renderContext.fillStyle = "black";
    renderContext.font = "14px Arial";
    renderContext.textAlign = "center";
    renderContext.textBaseline = "middle";
    // draw population to 1 decimal place

    if (city.population > 0) {
      renderContext.fillText(
        cities[i].population.toFixed(0).toString(),
        cities[i].location.x,
        cities[i].location.y,
        NODE_RADIUS * 2
      );
    }
  }
}

function drawArrowBetweenCircles(
  renderContext: CanvasRenderingContext2D,
  circle1: { x: number; y: number; radius: number },
  circle2: { x: number; y: number; radius: number },
  arrowLength: number,
  arrowAngle: number,
  perpendicularOffset: number
) {
  // Calculate the distance between the centers of the circles
  const dx = circle2.x - circle1.x;
  const dy = circle2.y - circle1.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  // calculate perpendicular offset
  const perpX = (-dy / distance) * perpendicularOffset;
  const perpY = (dx / distance) * perpendicularOffset;

  // Calculate the coordinates of the points where the arrow intersects the circles
  const x1 = circle1.x + (dx / distance) * circle1.radius + perpX;
  const y1 = circle1.y + (dy / distance) * circle1.radius + perpY;
  const x2 = circle2.x - (dx / distance) * circle2.radius + perpX;
  const y2 = circle2.y - (dy / distance) * circle2.radius + perpY;

  // Calculate the angle of the arrow
  const angle = Math.atan2(y2 - y1, x2 - x1);

  // Draw the line between the circles
  renderContext.beginPath();

  renderContext.moveTo(x1, y1);
  renderContext.lineTo(x2, y2);
  renderContext.stroke();

  // Draw the arrowhead
  renderContext.beginPath();
  renderContext.moveTo(x2, y2);
  renderContext.lineTo(
    x2 - arrowLength * Math.cos(angle - arrowAngle),
    y2 - arrowLength * Math.sin(angle - arrowAngle)
  );
  renderContext.lineTo(
    x2 - arrowLength * Math.cos(angle + arrowAngle),
    y2 - arrowLength * Math.sin(angle + arrowAngle)
  );
  renderContext.closePath();
  renderContext.fill();
}
