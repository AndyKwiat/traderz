import { CreateNodes, NodeType, City, Ship, GoodsNames } from "./world.js";
import { CurState, SetRedrawFunc } from "./states.js";
import { Coord } from "./utils.js";
const CITY_COUNT = 20;
const AREA_RADIUS = 280;
const NUM_SHIPS = 0;

SetRedrawFunc(redraw);
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

let { cities, lanes } = CreateNodes(CITY_COUNT, AREA_RADIUS);

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
    //AdvanceTurn(cities, ships);
    redraw();
  }
  if (event.key === "Escape") {
    CurState.EscapeClicked();
    updateStateMessage();
  }
});

const nonStopTurnCheckbox = document.getElementById(
  "turn-checkbox"
) as HTMLInputElement;
let nonStopTurn = false;
nonStopTurnCheckbox.addEventListener("change", function () {
  if (this.checked) {
    console.log("Checkbox is checked.");
    nonStopTurn = true;
  } else {
    console.log("Checkbox is not checked.");
    nonStopTurn = false;
  }
});

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

const NODE_RADIUS = 10;
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

  renderContext.strokeStyle = "rgba(0,0,0,0.2)";
  renderContext.lineWidth = 1;

  for (let j = 0; j < lanes.length; j++) {
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
    renderContext.beginPath();
    renderContext.arc(
      cities[i].location.x,
      cities[i].location.y,
      NODE_RADIUS,
      0,
      2 * Math.PI
    );

    let clr = "white";
    switch (cities[i].type) {
      case NodeType.Forest:
        clr = "green";
        break;
      case NodeType.Plains:
        clr = "yellow";
        break;
      case NodeType.Stone:
        clr = "grey";
        break;
    }

    renderContext.fillStyle = clr;
    renderContext.fill();
    if (cities[i] == curNode) {
      renderContext.lineWidth = 5;
    } else {
      renderContext.lineWidth = 2;
    }
    renderContext.stroke();
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
    // draw good count above city
    renderContext.fillStyle = "black";
    renderContext.font = "10px Arial";
    renderContext.textAlign = "center";
    renderContext.textBaseline = "bottom";
    var showGood = (gn: number, x: number, y: number) => {
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
    showGood(0, -2.1, -0.1);
    showGood(1, 0.8, -0.8);
    showGood(2, 1.7, 0.5);
    renderContext.fillText(
      `im-${cities[i].ImportRoutes.length} ex-${cities[i].ExportRoutes.length})`,
      cities[i].location.x + NODE_RADIUS,
      cities[i].location.y + NODE_RADIUS * 3,
      NODE_RADIUS * 25
    );

    // draw the population  in center of circle
    renderContext.fillStyle = "black";
    renderContext.font = "14px Arial";
    renderContext.textAlign = "center";
    renderContext.textBaseline = "middle";
    // draw population to 1 decimal place

    renderContext.fillText(
      cities[i].population.toFixed(0).toString(),
      cities[i].location.x,
      cities[i].location.y,
      NODE_RADIUS * 2
    );
  }
}
