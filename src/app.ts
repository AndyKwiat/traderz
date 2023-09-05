import { CreateNodes, NodeType, City, Ship } from "./world.js";
import { Coord } from "./utils.js";

// Set up the canvas
const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const messageBox = document.getElementById("message")!;

const ctx = canvas.getContext("2d")!;

let curNode: City | null;
// Initialize variables for panning and scaling
let panX = canvas.width / 2;
let panY = canvas.height / 2;
let scale = 1;

let nodes = CreateNodes(30, 800);
let ships: Ship[] = [];
ships.push(Ship.CreateShip("Laska", nodes[14]));
console.log("shipping the ship");
const shipImg = new Image();
shipImg.src = "shipblue.png";

document.addEventListener("keydown", (event: KeyboardEvent) => {
  if (event.key === " ") {
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
function redraw() {
  /// draw blue background
  ctx.fillStyle = "lightblue";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  // Save the current transformation state
  ctx.save();
  // Apply the panning and scaling transformations
  ctx.scale(scale, scale);
  ctx.translate(panX, panY);

  // draw the nodes
  ctx.fillStyle = "rgba(255,255,0,0.5)";
  ctx.strokeStyle = "black";

  for (let i = 0; i < nodes.length; i++) {
    ctx.beginPath();
    ctx.arc(
      nodes[i].location.x,
      nodes[i].location.y,
      NODE_RADIUS,
      0,
      2 * Math.PI
    );
    let clr = "rgba(255,255,0,0.5)";
    switch (nodes[i].type) {
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
    ctx.fillStyle = clr;
    ctx.fill();
    if (nodes[i] == curNode) {
      ctx.lineWidth = 5;
    } else {
      ctx.lineWidth = 2;
    }
    ctx.stroke();
    // draw the node name below the circle
    ctx.fillStyle = "black";
    ctx.font = "28px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(
      nodes[i].name,
      nodes[i].location.x,
      nodes[i].location.y + NODE_RADIUS,
      NODE_RADIUS * 25
    );
    // draw the node name in center of circle
    ctx.fillStyle = "black";
    ctx.font = "10px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      nodes[i].id.toString(),
      nodes[i].location.x,
      nodes[i].location.y,
      NODE_RADIUS * 2
    );
  }
  // draw ships
  for (let i = 0; i < ships.length; i++) {
    let loc = ships[i].location;

    if (ships[i].dockedCity != null) {
      loc = ships[i].dockedCity!.location.add(-NODE_RADIUS, -NODE_RADIUS);
    }
    ctx.drawImage(shipImg, loc.x - 10, loc.y - 10, 20, 20);
  }

  // Restore the transformation state
  ctx.restore();
}
function coordToNode(nodes: City[], spot: Coord): City | null {
  const RAD_SQ = NODE_RADIUS * NODE_RADIUS;
  let foundNode = null;
  nodes.forEach((node: City) => {
    if (node.location.distanceSq(spot) <= RAD_SQ) {
      foundNode = node;
      return;
    }
  });

  return foundNode;
}
function handleClick(event: any) {
  const canvas = event.target; // Get the canvas element

  const rect = canvas.getBoundingClientRect(); // Get the canvas position

  const x = event.clientX - rect.left; // Calculate the x-coordinate of the click relative to the canvas
  const y = event.clientY - rect.top; // Calculate the y-coordinate of the click relative to the canvas

  const worldX = x / scale - panX;
  const worldY = y / scale - panY;

  const ctx = canvas.getContext("2d"); // Get the 2D rendering context

  // Draw a blue circle at the click location
  ctx.beginPath();
  ctx.fillStyle = "blue";

  ctx.arc(x, y, 5, 0, Math.PI * 2);
  ctx.fill();
  let clickedNode = coordToNode(nodes, new Coord(worldX, worldY));
  let worldChaged = false;

  redraw();
}

canvas.addEventListener("click", handleClick);

redraw();
