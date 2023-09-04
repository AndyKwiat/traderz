import {
  CreateNodes,
  NodeType,
  wNode,
  Coord,
  Edge,
  UpdateTravel,
} from "./world.js";

// Set up the canvas
const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const messageBox = document.getElementById("message")!;
canvas.style.border = "1px solid black";
const ctx = canvas.getContext("2d")!;

let roadMode = false;
let curNode: wNode | null;
// Initialize variables for panning and scaling
let panX = canvas.width / 2;
let panY = canvas.height / 2;
let scale = 1;

let nodes = CreateNodes(100, 400);
let edges: Edge[] = [];

function onWorldChanged() {
  UpdateTravel(nodes, edges);
}

document.addEventListener("keydown", (event: KeyboardEvent) => {
  if (event.key === " ") {
    toggleRoadMode();
  }
});

// add button beside messagebox
let button = document.createElement("button");
button.innerHTML = "Toggle Road Mode";
button.addEventListener("click", (event) => {
  toggleRoadMode();
});

messageBox.appendChild(button);

function toggleRoadMode() {
  curNode = null;
  roadMode = !roadMode;
  redraw();
}

// Function to handle mouse wheel event for scaling
canvas.addEventListener("wheel", (event) => {
  // Calculate the new scale based on the wheel event
  const deltaY = event.deltaY;
  const scaleFactor = Math.sign(deltaY) > 0 ? 0.9 : 1.1;
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

// Define the positions and radius of the circles
const circle1 = { x: 50, y: 50, radius: 20 };
const circle2 = { x: 150, y: 150, radius: 30 };
const NODE_RADIUS = 10;
function redraw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // Save the current transformation state
  ctx.save();
  // Apply the panning and scaling transformations
  ctx.scale(scale, scale);
  ctx.translate(panX, panY);
  // draw the edges
  ctx.strokeStyle = "black";
  ctx.lineWidth = 0.2;
  let travel = 0;
  let totLen = 0;
  let mineCount = 0;
  let minesServed = 0;
  let factoryCount = 0;
  let factoryServed = 0;
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].type == NodeType.Mine) mineCount++;
    if (nodes[i].type == NodeType.Factory) {
      factoryCount++;
      minesServed += nodes[i].inputs;
    }
    if (nodes[i].type == NodeType.Market) {
      factoryServed += nodes[i].inputs;
    }
  }
  edges.forEach((e) => {
    ctx.beginPath();
    ctx.moveTo(e.start.location.x, e.start.location.y);
    ctx.lineTo(e.end.location.x, e.end.location.y);
    ctx.lineWidth = 0.2 + e.travel;
    ctx.stroke();
    travel += e.travelDistance;
    totLen += e.length;
  });
  let cost = totLen + travel;
  let profit = ( factoryServed) * 100 - cost;

  messageBox.innerText = `Mode: ${
    roadMode ? "Road" : "City"
  } RoadLength: ${totLen.toFixed(0)}  
  Travel: ${travel.toFixed(
    0
  )} Mines/served: ${mineCount}/${minesServed} Factories/served: ${factoryCount}/${factoryServed}$ ${profit.toFixed(
    0
  )}`;

  // Draw the circles
  ctx.beginPath();
  ctx.arc(circle1.x, circle1.y, circle1.radius, 0, 2 * Math.PI);
  ctx.arc(circle2.x, circle2.y, circle2.radius, 0, 2 * Math.PI);
  ctx.fillStyle = "rgba(0,255,0,0.5)";
  ctx.fill();

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
    // draw the node name in center of circle
    ctx.fillStyle = "black";
    ctx.font = "10px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      nodes[i].name,
      nodes[i].location.x,
      nodes[i].location.y,
      NODE_RADIUS * 2
    );
  }

  // Draw the line connecting the circles
  ctx.beginPath();
  ctx.moveTo(circle1.x, circle1.y);
  ctx.lineTo(circle2.x, circle2.y);
  ctx.strokeStyle = "red";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Restore the transformation state
  ctx.restore();
}
function coordToNode(nodes: wNode[], spot: Coord): wNode | null {
  const RAD_SQ = NODE_RADIUS * NODE_RADIUS;
  let foundNode = null;
  nodes.forEach((node: wNode) => {
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
  if (clickedNode) {
    if (roadMode) {
      if (clickedNode == curNode) {
        curNode = null;
      } else {
        if (curNode) {
          addRoad(curNode, clickedNode);

          worldChaged = true;
        }
        curNode = clickedNode;

        if (worldChaged) {
          // if you added a road and it's a dead end, clear the curNode
          let edgeCount = 0;
          edges.forEach((e) => {
            if (e.start == curNode || e.end == curNode) edgeCount++;
          });
          console.log("edge count: " + edgeCount);
          if (edgeCount > 1) curNode = null;
        }
      }
    } else {
      clickedNode.type += 1;
      if (clickedNode.type > NodeType.Market) {
        clickedNode.type = NodeType.Empty;
      }
      worldChaged = true;
      curNode = clickedNode;
    }
    if (worldChaged) onWorldChanged();

    redraw();
  }
}

function addRoad(start: wNode, end: wNode) {
  // check if edge already exists
  for (let i = 0; i < edges.length; i++) {
    if (
      (edges[i].start == start && edges[i].end == end) ||
      (edges[i].start == end && edges[i].end == start)
    ) {
      return;
    }
  }
  edges.push(new Edge(start, end));
}

canvas.addEventListener("click", handleClick);

redraw();
