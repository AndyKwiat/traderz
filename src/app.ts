import {
  CreateNodes,
  NodeType,
  City,
  Ship,
  AdvanceTurn,
  GoodsNames,
} from "./world.js";
import { Coord } from "./utils.js";

// Set up the canvas
const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const messageBox = document.getElementById("message")!;

const renderContext = canvas.getContext("2d")!;

let curNode: City | null;
// Initialize variables for panning and scaling
let panX = canvas.width / 2;
let panY = canvas.height / 2;
let scale = 1;

let cities = CreateNodes(30, 800);
let ships: Ship[] = [];
ships.push(Ship.CreateShip("Laska", cities[14]));
// console.log("shipping the ship");
const shipImg = new Image();
shipImg.src = "shipblue.png";

document.addEventListener("keydown", (event: KeyboardEvent) => {
  if (event.key === " ") {
    console.log("space bar pressed");
    // AdvanceTurn(cities, ships);
    // redraw();
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
function redraw() {
  /// draw blue background
  renderContext.fillStyle = "lightblue";
  renderContext.fillRect(0, 0, canvas.width, canvas.height);
  // Save the current transformation state
  renderContext.save();
  // Apply the panning and scaling transformations
  renderContext.scale(scale, scale);
  renderContext.translate(panX, panY);

  // draw the nodes
  renderContext.fillStyle = "rgba(255,255,0,0.5)";
  renderContext.strokeStyle = "black";

  for (let i = 0; i < cities.length; i++) {
    renderContext.beginPath();
    renderContext.arc(
      cities[i].location.x,
      cities[i].location.y,
      NODE_RADIUS,
      0,
      2 * Math.PI
    );
    let clr = "rgba(255,255,0,0.5)";
    switch (cities[i].type) {
      case NodeType.Empty:
        clr = "white";
        break;
      case NodeType.Mine:
        clr = "gray";
        break;
      case NodeType.Factory:
        clr = "red";
        break;
      case NodeType.Market:
        clr = "green";
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
    renderContext.font = "28px Arial";
    renderContext.textAlign = "center";
    renderContext.textBaseline = "top";
    renderContext.fillText(
      cities[i].name,
      cities[i].location.x,
      cities[i].location.y + NODE_RADIUS,
      NODE_RADIUS * 25
    );
    // draw the node name in center of circle
    renderContext.fillStyle = "black";
    renderContext.font = "10px Arial";
    renderContext.textAlign = "center";
    renderContext.textBaseline = "middle";
    renderContext.fillText(
      cities[i].id.toString(),
      cities[i].location.x,
      cities[i].location.y,
      NODE_RADIUS * 2
    );
  }
  // draw ships
  for (let i = 0; i < ships.length; i++) {
    let loc = ships[i].location;

    if (ships[i].dockedCity != null) {
      loc = ships[i].dockedCity!.location.add(NODE_OFFSET);
    }

    renderContext.drawImage(shipImg, loc.x - 10, loc.y - 10, 20, 20);
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
  }

  // Restore the transformation state
  renderContext.restore();
}

function loop() {
  if (ships[0].targetCity != null) {
    AdvanceTurn(cities, ships);
    redraw();
  }
  setTimeout(loop, 50);
}
loop();

function coordToNode(nodes: City[], spot: Coord): City | null {
  const RAD_SQ = NODE_RADIUS * NODE_RADIUS * 4; // little extra padding
  let foundNode = null;
  nodes.forEach((node: City) => {
    if (node.location.distanceSq(spot) <= RAD_SQ) {
      foundNode = node;
      return;
    }
  });

  return foundNode;
}

let lastHoveredNode: City | null = null;
canvas.addEventListener("mousemove", (event) => {
  const rect = canvas.getBoundingClientRect(); // Get the canvas position
  const x = event.clientX - rect.left; // Calculate the x-coordinate of the click relative to the canvas
  const y = event.clientY - rect.top; // Calculate the y-coordinate of the click relative to the canvas
  const worldX = x / scale - panX;
  const worldY = y / scale - panY;
  let foundNode = coordToNode(cities, new Coord(worldX, worldY));

  if (foundNode != null) {
    if (foundNode != lastHoveredNode) {
      lastHoveredNode = foundNode;
      messageBox.innerHTML = foundNode.name;

      curNode = foundNode;
      cityHoverMenuTitle.innerHTML = foundNode.name;
      cityHoverMenu.style.display = "block";
      cityHoverMenu.style.left = event.clientX + "px";
      cityHoverMenu.style.top = event.clientY + "px";
      for (let i = 0; i < curNode.prices.length; i++) {
        let div = document.getElementById(
          "city-hover-menu-goods-count-" + i.toString()
        )!;
        div.innerHTML = curNode.prices[i].toString();
      }
    }
  } else {
    lastHoveredNode = null;
    cityHoverMenu!.style.display = "none";

    messageBox.innerHTML = "";
    curNode = null;
  }
  // redraw();
});
function handleClick(event: any) {
  const canvas = event.target; // Get the canvas element

  const rect = canvas.getBoundingClientRect(); // Get the canvas position

  const x = event.clientX - rect.left; // Calculate the x-coordinate of the click relative to the canvas
  const y = event.clientY - rect.top; // Calculate the y-coordinate of the click relative to the canvas

  const worldX = x / scale - panX;
  const worldY = y / scale - panY;

  let clickedCity = coordToNode(cities, new Coord(worldX, worldY));
  if (clickedCity != null) {
    let ship = ships[0];
    ship.targetCity = clickedCity;
  }

  redraw();
}

canvas.addEventListener("click", handleClick);

redraw();
