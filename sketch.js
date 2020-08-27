"use strict"
const ENTITY_SIZE = 20
const ENTITY_MAX_VELOCITY = 5

const ORIGIN_VECTOR = new p5.Vector(1, 0);
const AMOUNT = 150
const PADDING = 10
const BACKGROUND_COLOR = [10, 10, 51]
const FPS = 60

const ZOOM = 1.5


const TREE_CAP = AMOUNT / 20;


let TREE_DEBUG = false
let SHOW_TEXT_DEBUG = false
let SHOW_COUNT_DEBUG = false
let SHOW_ORIENTATION_DEBUG = false

const ENTITY_PERSONAL_SPACE = ENTITY_SIZE
const ENTITY_DETECTION_RANGE = 75


//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
let entities = undefined;
let tree = undefined

function windowResized() {
  noLoop()
  resizeCanvas((windowWidth - PADDING) / ZOOM,( windowHeight - PADDING)/ ZOOM)
  tree.renew()
  loop()
}

function setup() {
  background(...BACKGROUND_COLOR);
  createCanvas((windowWidth - PADDING)/ ZOOM, (windowHeight - PADDING)/ ZOOM);
  tree = new TreeHandler()
  entities = generateEntities(tree, AMOUNT)
  frameRate(FPS);

  TREE_DEBUG = createCheckbox('DEBUG Tree', false);
  SHOW_TEXT_DEBUG = createCheckbox('DEBUG SHOWTEXT', false);
  SHOW_COUNT_DEBUG = createCheckbox('DEBUG COUNT', false);
  SHOW_ORIENTATION_DEBUG = createCheckbox('DEBUG POSITIONING', false);


  document.querySelector("body").style.padding = PADDING / 2
  document.querySelector("body").style.background = `rgb(${BACKGROUND_COLOR[0]}, ${BACKGROUND_COLOR[0]}, ${BACKGROUND_COLOR[0]})`
}

function draw() {
  background(...BACKGROUND_COLOR);
  tree.reClamp()
  tree.update()
  tree.show()

  noStroke()
  fill(0, 255, 0)
  text(round(frameRate()), width - 20, height - 10);
}


//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
//------------------------------------------------------------------------------

function generateEntities(tree, AMOUNT) {
  let a = []
  for (let i = 0; i < AMOUNT; i++) {
    let c = color(random(100, 255), random(100, 255), random(100, 255))
    let entity = new Entity(c,
      ENTITY_SIZE,
      ...[width * random(), height * random()])
    tree.add(new Leaf(entity))
    a.push(entity)
  }
  return a
}


//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
//------------------------------------------------------------------------------

function calculateVectorAngle(a, b) {
  return acos(calculateDotProduct(a, b) / (calculateLength(a) * calculateLength(b)))
}

function calculateDotProduct(a, b) {
  let val = Object.values(a)
  let bval = Object.values(b)
  return val.reduce((akk, ele, idx) => {
    return akk + ele * bval[idx]
  }, 0)
}

function calculateLength(a) {
  let val = Object.values(a)
  let count = val.reduce((akk, ele) => {
    return akk + ele * ele
  }, 0)
  return sqrt(count)
}


//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
//------------------------------------------------------------------------------

class Entity {
  constructor(color, size, posX, posY) {
    this.maxSpeed = ENTITY_MAX_VELOCITY
    this.maxForce = .5;
    this.position = new p5.Vector(posX, posY)
    this.size = sqrt(size * 2 / 3);
    this.color = color;

    this.velocity = p5.Vector.random2D();
    this.velocity.setMag(random(2, 4));
    this.acceleration = createVector();

    this.next = undefined
  };

  update() {
    this.position.add(this.velocity);
    this.velocity.add(this.acceleration);
    this.velocity.limit(this.maxSpeed);

    realignVector(this.position)

    strokeWeight(this.size * 2)
    stroke(this.color)
    let cpyy = this.velocity.copy()
    cpyy.add(this.position)
    line(cpyy.x, cpyy.y, (cpyy.x + this.acceleration.x), (cpyy.y + this.acceleration.y))
    strokeWeight(1)
    this.acceleration.mult(0);
  }

  flock(boids) {
    let alignment = this.align(boids);
    let cohesion = this.cohesion(boids);
    let separation = this.separation(boids);

    this.acceleration.add(alignment);
    this.acceleration.add(cohesion);
    this.acceleration.add(separation);
  }

  align(boids) {
    let steering = createVector();
    let total = 0;
    for (let other of boids) {
      let d = distanceBoids([
        this.position.x,
        this.position.y],
        [other.position.x,
        other.position.y],
        ENTITY_DETECTION_RANGE
      );
      if (other != this && d < ENTITY_DETECTION_RANGE
        && ENTITY_PERSONAL_SPACE < d) {
        steering.add(other.velocity);
        total++;
      }
    }
    if (total > 0) {
      steering.div(total);
      steering.setMag(this.maxSpeed);
      steering.sub(this.velocity);
      steering.limit(this.maxForce);
    }
    return steering;
  }

  cohesion(boids) {
    let steering = createVector();
    let total = 0;
    for (let other of boids) {
      let d = distanceBoids([
        this.position.x,
        this.position.y],
        [other.position.x,
        other.position.y],
        ENTITY_DETECTION_RANGE
      );
      if (other != this && d < ENTITY_DETECTION_RANGE
        && ENTITY_PERSONAL_SPACE < d) {
        steering.add(other.position);
        total++;
      }
    }
    if (total > 0) {
      steering.div(total);
      steering.sub(this.position);
      steering.setMag(this.maxSpeed);
      steering.sub(this.velocity);
      steering.limit(this.maxForce);
    }
    return steering;
  }

  separation(boids) {
    let steering = createVector();
    let total = 0;
    for (let other of boids) {
      let d = distanceBoids([
        this.position.x,
        this.position.y],
        [other.position.x,
        other.position.y],
        ENTITY_DETECTION_RANGE
      );
      if (other != this && d < ENTITY_DETECTION_RANGE) {
        let diff = p5.Vector.sub(this.position, other.position);
        diff.div(d * d);
        steering.add(diff);
        total++;
      }
    }
    if (total > 0) {
      steering.div(total);
      steering.setMag(this.maxSpeed);
      steering.sub(this.velocity);
      steering.limit(this.maxForce);
    }
    return steering;
  }


  setColor(color) {
    this.color = color
  }

  setPos(x, y) {
    this.position.set(x, y)
  }

  setVector(newVector) {
    this.direction = newVector
  }

  addVector(newX, newY) {
    this.direction.add(newX, newY)
  }

  addVectorAngle(x) {
    this.direction.rotate(x)
  }


  show() {
    strokeWeight(this.size)
    stroke(this.color)
    point(this.position.x, this.position.y)
  }
}


//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
//------------------------------------------------------------------------------

class Tree {
  constructor() {
  }
  getParent() { }
  show() { }
  getBoundaries() { }
  getValue() { }
  size() { }
  executeOnLeaf() { }
}

class Leaf extends Tree {
  constructor(e, parent) {
    super()
    this.val = e // one entity
    this.parent = parent
  }

  show() {
    this.val.show()
  }

  getValue() {
    return this.val
  }

  reParent(p) {
    this.parent = p
  }
  size() {
    return 1;
  }

  coordinates() {
    return this.val.position.array()
  }

  executeOnLeaf(func) {
    func(this.val)
  }
}

class Node extends Tree {
  constructor(x, y, x1, y1, parent) {
    super()
    this.branches = [];
    this.parent = parent;
    this.x0 = x;
    this.y0 = y;
    this.x1 = x1;
    this.y1 = y1;
    this.split = false;
    this.title = "root";
    this.depth = 0;
    this.leafes = new Set();
  }

  executeOnLeaf(func) {
    if (this.split) {
      this.branches.forEach(e => e.executeOnLeaf(func))
    } else {
      this.leafes.forEach(e => e.executeOnLeaf(func))
    }
  }

  reClampTree() {
    if (this.split) {
      let newLeafes = new Set()
      if (this.size() <= TREE_CAP) {
        this.branches.forEach(e => {
          let subtree = e.getSubTree()
          subtree.forEach(x => {
            x.leafes.forEach(element => {
            this.leafes.add(element)
          })
        })
      })
      this.branches = []
      this.split = false
    } else {
      this.branches.forEach(e => {
        e.reClampTree()
      })
    }
  }
}


update(root){
  if (this.split) {
    this.branches.forEach(e => e.update(root))
  } else {
    this.leafes.forEach((val) => {
      val.executeOnLeaf((e) => {
        let entis = root.getNeighbouredBoids(e.position.x, e.position.y, ENTITY_DETECTION_RANGE)
        e.flock(entis)
        e.update()
      })

      let afterX, afterY
      [afterX, afterY] = val.coordinates()
      if (!this.inBoundary(afterX, afterY)) {
        this.leafes.delete(val)
        this.reDeploy(val)
      }
    })
  }
}

reDeploy(leaf) {
  let x, y
  [x, y] = leaf.coordinates()
  let p = this
  while (!p.inBoundary(x, y)) {
    p = p.parent
  }
  p.add(leaf)
}


show() {
  if (TREE_DEBUG.checked()) {
    let c = color(0, 255, 0, 75)
    fill(255, 75)
    noStroke()
    let textt = ""
    if (SHOW_ORIENTATION_DEBUG.checked()) {
      textt = `${this.title}`
    }
    if (SHOW_COUNT_DEBUG.checked() && SHOW_ORIENTATION_DEBUG.checked()) {
      textt += " "
    }
    if (SHOW_COUNT_DEBUG.checked()) {
      textt += ` ${this.size()}`
    }

    if (SHOW_TEXT_DEBUG.checked()) {
      text(textt, this.x0 + (this.x1 - this.x0) / 2 - (textt.length) / 2, this.y0 + (this.y1 - this.y0) / 2);
    }

    fill(0, 0, 0, 0)
    stroke(c)
    strokeWeight(1)
    rect(this.x0, this.y0, this.x1 - this.x0, this.y1 - this.y0)
  }
  if (this.split) {
    for (let i of this.branches) {
      i.show();
    }
  } else {
    this.leafes.forEach(e => e.show())
  }
}
getLeafes(){
  let leafes = new Set()
  if (this.split) {
    this.branches.forEach(e => {
      this.add(...e.getLeafes())
    })
    return leafes
  } else {
    this.leafes.forEach(e => leafes.add(e))
    if (this.leafes.has(undefined)) {
      print("LEAFES:", this.leafes)
    }
    return leafes
  }
}

getSubTree() {
  if(this.split) {
    let sub = []
    this.branches.forEach(ele => {

      sub.push(...ele.getSubTree())
    })
    return sub
  } else {
    return [this]
  }
}

highlight() {
  if (!this.split) {
    LAST.add(this)
    fill(255, 50)
    noStroke();
    rect(this.x0, this.y0, this.x1 - this.x0, this.y1 - this.y0)
  }
}

get(x, y) {
  if (this.split) {
    let curr = undefined
    this.branches.forEach(val => {
      if (val.inBoundary(x, y)) {
        curr = val
      }
    })
    return curr.get(x, y)
  } else {
    return this;
  }
}

size() {
  if (this.split) {
    let count = 0
    this.branches.forEach((val) => {
      count += val.size()
    })
    return count
  } else {
    return this.leafes.size
  }
}

getBoundary() {
  return [this.x0, this.y0, this.x1, this.y1]
}

inBoundary(x, y) {
  let x0, y0, x1, y1
  [x0, y0, x1, y1] = this.getBoundary()
  return (x0 < x && y0 < y && x1 >= x && y1 >= y)
}

getSector(sector) {
  if (this.split) {
    return this.branches[sector]
  }
}

add(e) {
  if (this.split) {
    this.branches.forEach(ele => {
      if (ele.inBoundary(...e.coordinates())) {
        if (e == undefined) {
          print("EEE: ", undefined)
        }
        ele.add(e)
      }
    })
  } else {
    if ((this.leafes.size + 1) <= TREE_CAP) {
      if (e == undefined) {
        print("EEE: ", undefined)
      }
      e.reParent(this)
      this.leafes.add(e);
    } else {
      let newBranches = []
      let segmentX = (this.x1 - this.x0) / 2
      let segmentY = (this.y1 - this.y0) / 2
      let p0_ = this.x0
      let p1_ = this.x0 + segmentX
      let p2_ = this.x0 + segmentX * 2
      let p_0 = this.y0
      let p_1 = this.y0 + segmentY
      let p_2 = this.y0 + segmentY * 2

      let upperLeftt = new Node(p0_, p_0, p1_, p_1, this);
      upperLeftt.title = "upperLeftt"
      upperLeftt.depth = this.depth + 1
      let upperRight = new Node(p1_, p_0, p2_, p_1, this);
      upperRight.title = "upperRight"
      upperRight.depth = this.depth + 1
      let lowerLeftt = new Node(p0_, p_1, p1_, p_2, this);
      lowerLeftt.title = "lowerLeftt"
      lowerLeftt.depth = this.depth + 1
      let lowerRight = new Node(p1_, p_1, p2_, p_2, this);
      lowerRight.title = "lowerRight"
      lowerRight.depth = this.depth + 1

      newBranches.push(upperLeftt)
      newBranches.push(upperRight)
      newBranches.push(lowerLeftt)
      newBranches.push(lowerRight)

      this.leafes.forEach(leaf => {
        newBranches.forEach((branch) => {
          if (branch.inBoundary(...leaf.coordinates())) {
            leaf.reParent(branch)
            branch.add(leaf)
            this.leafes.delete(leaf)
          }
        })
      })
      this.split = true
      this.branches = newBranches
      if (e == undefined) {
        print("EEE: ", undefined)
      }
      this.add(e)
    }
  }
}
}


//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
//------------------------------------------------------------------------------


class TreeHandler {
  constructor() {
    this.head = new Node(0, 0, width, height, undefined);
  }
  add(e) {
    this.head.add(e)
  }
  searchTree(x, y) {
    return this.head.searchNeighbour(x, y)
  }
  show() {
    this.head.show()
  }

  get(x, y) {
    return this.head.get(x, y)
  }

  highlight(x, y) {
    this.head.highlight(x, y)
  }

  getTree() {
    return this.head.getSubTree()
  }

  execute(func) {
    this.head.executeOnLeaf(func)
  }

  update() {
    this.head.update(this)
  }

  reClamp() {
    this.head.reClampTree()
  }


  getNeighbouredBoids(x, y, radius) {
    let c = tree.getTree()
    let neighbours = new Set()
    c.forEach(e => {
      if (inDistance([x, y], radius, e)) {
        e.getLeafes().forEach((element, i, list) => {
          if (list.has(undefined)) {
            print(list)
          }
          neighbours.add(element.getValue())
        })
      }
    })
    return neighbours
  }


  renew() {
    let newSet = this.head.getLeafes()
    this.head = new Node(0, 0, width, height, undefined);
    newSet.forEach(e => {
      this.head.add(e)
    })
  }

}





//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
//------------------------------------------------------------------------------

function diagonal(branch) {
  let treeX0, treeY0, treeX1, treeY1
  [treeX0, treeY0, treeX1, treeY1] = branch.getBoundary()
  return dist(treeX0, treeY0, treeX1, treeY1)
}

function middle(branch) {
  let treeX0, treeY0, treeX1, treeY1
  [treeX0, treeY0, treeX1, treeY1] = branch.getBoundary()
  let segmentX = (treeX1 - treeX0) / 2
  let segmentY = (treeY1 - treeY0) / 2
  let treeMidX = treeX0 + segmentX
  let treeMidY = treeY0 + segmentY
  return [treeMidX, treeMidY]
}


function inDistance(coords, radius, branch) {
  let branchX, branchY
  [branchX, branchY] = middle(branch)
  let minDistance = dist(branchX, branchY, ...coords)
  let dots = []
  let x, y
  [x, y] = coords
  if ((x - radius) < 0) {
    if ((y - radius) < 0) {
      dots.push([x + width, y + height])
    }
    if ((y + radius) > height) {
      dots.push([x + width, y - height])
    }
  }
  if ((x + radius) > width) {
    if ((y - radius) < 0) {
      dots.push([x - width, y + height])
    }
    if ((y + radius) > height) {
      dots.push([x - width, y - height])
    }
  }
  if (0 < x && x < width) {
    if ((y - radius) < 0) {
      dots.push([x, y + height])
    }
    if ((y + radius) > height) {
      dots.push([x, y - height])
    }
  }
  if (0 < y && y < height) {
    if ((x - radius) < 0) {
      dots.push([x + width, y])
    }
    if ((x + radius) > width) {
      dots.push([x - width, y])
    }
  }
  dots.forEach(e => {
    minDistance = min(minDistance, dist(branchX, branchY, ...e))
  })
  return (minDistance - diagonal(branch) / 2 - radius) <= 0
}


function distanceBoids(coords, other, radius) {
  // return dist(...coords, ...other)
  let otherX, otherY
  [otherX, otherY] = other
  let minDistance = dist(otherX, otherY, ...coords)
  let dots = []
  let x, y
  [x, y] = coords
  if ((x - radius) < 0) {
    if ((y - radius) < 0) {
      dots.push([x + width, y + height])
    }
    if ((y + radius) > height) {
      dots.push([x + width, y - height])
    }
  }
  if ((x + radius) > width) {
    if ((y - radius) < 0) {
      dots.push([x - width, y + height])
    }
    if ((y + radius) > height) {
      dots.push([x - width, y - height])
    }
  }
  if (0 < x && x < width) {
    if ((y - radius) < 0) {
      dots.push([x, y + height])
    }
    if ((y + radius) > height) {
      dots.push([x, y - height])
    }
  }
  if (0 < y && y < height) {
    if ((x - radius) < 0) {
      dots.push([x + width, y])
    }
    if ((x + radius) > width) {
      dots.push([x - width, y])
    }
  }
  dots.forEach(e => {
    minDistance = min(minDistance, dist(otherX, otherY, ...e))
  })

  return (minDistance)
}



let stopped = false
function keyPressed() {
  if (key == "s") {
    if (!stopped) {
      stopped = true
      noLoop()
    } else {
      stopped = false
      loop()
    }
  } else if (key == "d") {
    draw()
  }

}

let fullScrn = false
function mouseClicked() {
  if (TREE_DEBUG && 0 <= mouseX && mouseX <= width && 0 <= mouseY && mouseY <= height) {
    draw()
    let c = tree.getTree()
    let radius = 50

    strokeWeight(10)
    stroke(255)
    point(mouseX, mouseY)
    strokeWeight(1)
    circle(mouseX, mouseY, radius * 2)

    c.forEach(e => {
      if (inDistance([mouseX, mouseY], radius, e)) {
        strokeWeight(10)
        stroke(0, 255, 0)
        point(...middle(e))
      }
    })
  } else {
    // fullScrn = !fullScrn
    // fullscreen(fullScrn)
  }
}



function getCoordinates(x, y) {
  let rejust = (i, j) => {
    return (i + j) % j
  }
  return [rejust(x, width), rejust(y, height)]
}

function sampleDots(pos, sample, radius) {
  let dots = []
  for (let i = 0; i < 360; i += 90 / sample) {
    angleMode(DEGREES)
    let x = pos[0] + cos(i) * radius
    let y = pos[1] + sin(i) * radius
    dots.push(getCoordinates(x, y))
  }
  return dots;
}


function calculateDegreeOffset(a, b) {
  let diffX = (a[0] - b[0])
  let diifY = (a[1] - b[1])
  angleMode(DEGREES)
  let beta = atan2(diifY, diffX)
  beta = (beta + 180) % 360
  let sampleX = cos(beta)
  let sampleY = sin(beta)
  return [sampleX, sampleY]
}



function realignVector(vector) {
  let newCoords = getCoordinates(...vector.array())
  vector.set(...newCoords)
}