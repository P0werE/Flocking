"use strict"


const PADDING = 10
const DIVOFFSET = 20
const BACKGROUND_COLOR = [[10, 10, 51], [0, 100]][0]
const FPS = 100

const ZOOM = 1


const AMOUNT = 500

const ENTITY_SIZE = 5
const ENTITY_MAX_VELOCITY = 20
const ENTITIY_FORCE = .5
const ENTITY_PERSONAL_SPACE =  ENTITY_MAX_VELOCITY * 2
const ENTITY_DETECTION_RANGE = ENTITY_MAX_VELOCITY * 3

const TREE_CAP = AMOUNT / Math.sqrt(AMOUNT * 2);
let TREE_DEBUG = false
let SHOW_TEXT_DEBUG = false
let SHOW_COUNT_DEBUG = false
let SHOW_ORIENTATION_DEBUG = false
let SHOW_INTERFACE = false



let div = undefined
let comparisions = 0

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
let entities = undefined;
let tree = undefined

function windowResized() {
  noLoop()
  resizeCanvas((windowWidth - PADDING) / ZOOM, (windowHeight - PADDING) / ZOOM - DIVOFFSET)
  tree.renew()
  loop()
}

function setup() {
  background(...BACKGROUND_COLOR);
  createCanvas((windowWidth - PADDING) / ZOOM, (windowHeight - PADDING) / ZOOM - DIVOFFSET, P2D);
  tree = new TreeHandler()
  entities = generateEntities(tree, AMOUNT)
  frameRate(FPS);

  print("TREECAP: ", TREE_CAP)

  div = createDiv();
  div.addClass("mydiv")


  TREE_DEBUG = createCheckbox('DEBUG Tree', false);
  SHOW_COUNT_DEBUG = createCheckbox('DEBUG COUNT', false);
  SHOW_ORIENTATION_DEBUG = createCheckbox('DEBUG POSITIONING', false);
  SHOW_INTERFACE = createCheckbox('FPS', false);

  div.child(TREE_DEBUG)
  div.child(SHOW_COUNT_DEBUG)
  div.child(SHOW_ORIENTATION_DEBUG)
  div.child(SHOW_INTERFACE)


  document.querySelector("body").style.padding = PADDING / 2
  document.querySelector("body").style.background = `rgb(${BACKGROUND_COLOR[0]}, ${BACKGROUND_COLOR[0]}, ${BACKGROUND_COLOR[0]})`
}
let fr = 0
let count = 1
let framectr = 1
function draw() {
  comparisions = 0
  framectr++
  fr += frameRate()

  background(...BACKGROUND_COLOR);
  tree.reClamp()
  tree.update()
  tree.show()

  if (SHOW_INTERFACE.checked()) {
    showDebug()
  }
}

function showDebug() {
  noStroke()
  fill(0, 255, 0)
  text(round(fr / framectr), width - 20, height - 10);
  text(round(comparisions / count), width - 50, height - 20);
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
    let n = new Leaf(entity)
    tree.add(n)
    a.push(n)
  }
  return a
}


//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
//------------------------------------------------------------------------------

class Entity {
  constructor(color, size, posX, posY) {
    this.maxSpeed = ENTITY_MAX_VELOCITY
    this.maxForce = ENTITIY_FORCE;
    this.position = new p5.Vector(posX, posY)
    this.size = size;
    this.color = color;

    this.velocity = p5.Vector.random2D();
    this.velocity.setMag(random(2, 4));
    this.acceleration = createVector();

    this.nextPosition = undefined
    this.nextVelocity = undefined

    this.dir = new p5.Vector(0, 0)
  };

  update() {
    this.nextPosition = new p5.Vector(0, 0)
    this.nextPosition.add(this.position)
    this.nextPosition.add(this.velocity)

    this.nextVelocity = new p5.Vector(0, 0)
    this.nextVelocity.add(this.velocity)
    this.nextVelocity.add(this.acceleration)
    this.nextVelocity.limit(this.maxSpeed)


    realignVector(this.nextPosition)


    this.dir.set(this.nextPosition)
    this.dir = this.dir.sub(this.position)
    this.dir.setMag(1)

    this.acceleration.mult(0);
  }


  flip() {
    this.position = this.nextPosition
    this.velocity = this.nextVelocity
  }

  
  flock(boids) {
    let neigh = new Set()
    for (let other of boids) {
      if (other != this) {
        let d = distanceBoids(
          this,
          other,
          ENTITY_DETECTION_RANGE
        );
        if (d < (ENTITY_DETECTION_RANGE * ENTITY_DETECTION_RANGE)) {
          neigh.add([other, d])
        }
      }
    }

    let alignment   = this.align(neigh);
    let cohesion    = this.cohesion(neigh);
    let separation  = this.separation(neigh);

    this.acceleration.add(alignment);
    this.acceleration.add(cohesion);
    this.acceleration.add(separation);

  }

  align(boids) {
    let steering = createVector();
    let total = boids.size;
    boids.forEach(e => steering.add(e[0].velocity))
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
    let total = boids.size;
    boids.forEach(e => steering.add(e[0].position ))
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
    for (let tuple of boids) {
      if((ENTITY_PERSONAL_SPACE * ENTITY_PERSONAL_SPACE) > tuple[1] ){
        let diff = p5.Vector.sub(this.position, tuple[0].position);
        diff.div(tuple[1]) ;
        steering.add(diff);
        total++
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

  show() {
    strokeWeight(this.size)
    stroke(this.color)
    point(this.position.x, this.position.y)

    // let x = this.position.x
    // let y = this.position.y
    // let n = 5
    // let coss = cos(this.dir.heading())
    // let sinn = sin(this.dir.heading())
  
    // strokeWeight(2)
    // stroke(this.color)
    // fill(this.color)
    
    // triangle(
    //   x,
    //   y,
    //   x - coss * n,
    //   y - sinn * n,
    //   x - coss * n,
    //   y + sinn * n)
  }
}


//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
//------------------------------------------------------------------------------

class Tree {
  constructor() { }
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
  flip() {
    this.getValue().flip()
  }
}


class Node extends Tree {
  constructor(x, y, x1, y1, parent) {
    super()
    this.branches = [];
    this.parent = parent;
    this.pos0 = new p5.Vector(x, y)
    this.pos1 = new p5.Vector(x1, y1)
    this.center = new p5.Vector(x + (x1 - x) / 2, y + (y1 - y) / 2)
    this.diagonal = this.pos1.dist(this.pos0)
    this.split = false;
    this.title = "root";
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


  update(root) {
    if (this.split) {
      this.branches.forEach(e => e.update(root))
    } else {
      this.leafes.forEach((val) => {
        val.executeOnLeaf((e) => {
          let entis = root.getNeighbouredBoids(e.position, ENTITY_DETECTION_RANGE)
          e.flock(entis)
          e.update()
        })
      })
    }
  }


  flip() {
    if (this.split) {
      this.branches.forEach(e => e.flip())
    } else {
      this.leafes.forEach(e => {
        e.flip()
        let afterX, afterY
        [afterX, afterY] = e.coordinates()
        if (!this.inBoundary(afterX, afterY)) {
          this.leafes.delete(e)
          this.reDeploy(e)
        }
      }
      )
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
    if (SHOW_ORIENTATION_DEBUG.checked() || SHOW_COUNT_DEBUG.checked()) {
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
      fill(255, 100)
      noStroke()
      strokeWeight(2)
      text(textt,
        this.center.x - (textt.length) / 2,
        this.center.y);
    }

    if (TREE_DEBUG.checked()) {
      let c = color(0, 255, 0, 150)
      stroke(c)
      strokeWeight(1)
      fill(0, 0)
      rect(this.pos0.x, this.pos0.y, this.pos1.x - this.pos0.x, this.pos1.y - this.pos0.y)
    }
    if (this.split) {
      for (let i of this.branches) {
        i.show();
      }
    } else {
      this.leafes.forEach(e => e.show())
    }
  }


  getLeafes() {
    let leafes = new Set()
    if (this.split) {
      this.branches.forEach(e => {
        this.add(...e.getLeafes())
      })
      return leafes
    } else {
      this.leafes.forEach(e => leafes.add(e))
      return leafes
    }
  }


  getSubTree() {
    if (this.split) {
      let sub = []
      this.branches.forEach(ele => {
        sub.push(...ele.getSubTree())
      })
      return sub
    } else {
      return [this]
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

  inBoundary(x, y) {
    return (this.pos0.x < x && this.pos0.y < y && this.pos1.x >= x && this.pos1.y >= y)
  }

  add(e) {
    if (this.split) {
      this.branches.forEach(ele => {
        if (ele.inBoundary(...e.coordinates())) {
          ele.add(e)
        }
      })
    } else {
      if ((this.leafes.size + 1) <= TREE_CAP) {
        e.reParent(this)
        this.leafes.add(e);
      } else {
        let newBranches = []
        let p0_ = this.pos0.x
        let p1_ = this.center.x
        let p2_ = this.pos1.x
        let p_0 = this.pos0.y
        let p_1 = this.center.y
        let p_2 = this.pos1.y

        let upperLeftt = new Node(p0_, p_0, p1_, p_1, this);
        upperLeftt.title = "upperLeftt"
        let upperRight = new Node(p1_, p_0, p2_, p_1, this);
        upperRight.title = "upperRight"
        let lowerLeftt = new Node(p0_, p_1, p1_, p_2, this);
        lowerLeftt.title = "lowerLeftt"
        let lowerRight = new Node(p1_, p_1, p2_, p_2, this);
        lowerRight.title = "lowerRight"

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

  show() {
    this.head.show()
  }

  getTree() {
    return this.head.getSubTree()
  }

  execute(func) {
    this.head.executeOnLeaf(func)
  }

  update() {
    this.head.update(this)
    this.head.flip()
  }

  reClamp() {
    this.head.reClampTree()
  }

  getNeighbouredBoids(vector, radius) {
    let c = tree.getTree()
    let neighbours = new Set()
    c.forEach(e => {
      if (inDistance(vector, radius, e)) {
        e.getLeafes().forEach((element) => {
          neighbours.add(element.getValue())
        })
      }
    })
    return neighbours
  }


  renew() {
    this.head = new Node(0, 0, width, height, undefined);
    entities = generateEntities(this, AMOUNT)
  }
}


//------------------------------------------------------------------------------
//------------------------------------------------------------------------------
//------------------------------------------------------------------------------


function inDistance(coords, radius, branch) {
  comparisions++
  let xx = branch.center.x - coords.x
  let yy = branch.center.y - coords.y
  let minDistance = xx * xx  + yy * yy

  // return (minDistance - branch.diagonal / 2 - radius) <= 0
  let dots = []
  let x = coords.x;
  let y = coords.y;
  if ((x - radius) < 0 ||
    (x + radius) > width ||
    (y - radius) < 0 ||
    (y + radius) > height) {
    let xes = []
    if ((x - radius) < 0) {
      xes.push(x + width)
    }
    if ((x + radius) > width) {
      xes.push(x - width)
    }

    if (0 < x && x < width) {
      xes.push(x)
    }

    let yes = []
    if ((y - radius) < 0) {
      yes.push(y + height)
    }
    if ((y + radius) > height) {
      yes.push(y - height)
    }

    if (0 < y && y < height) {
      yes.push(y)
    }

    xes.forEach(xx => {
      yes.forEach(yy => {
        dots.push([xx, yy])
      })
    })
  }

  dots.forEach(e => {
    xx = branch.center.x - e[0]
    yy = branch.center.y - e[1]
    let ooo = xx * xx  + yy * yy
    minDistance = min(minDistance, ooo)
    comparisions++
  })
  return (minDistance - ((branch.diagonal*branch.diagonal)/ 4)  - radius * radius) <= 0
}


function distanceBoids(coords, other, radius) {
  comparisions++
  let xx = other.position.x - coords.position.x
  let yy = other.position.y - coords.position.y
  let minDistance = xx * xx  + yy * yy
  // return minDistance
  let dots = []
  let x = coords.x;
  let y = coords.y;

  if ((x - radius) < 0 ||
    (x + radius) > width ||
    (y - radius) < 0 ||
    (y + radius) > height) {
    let xes = []
    if ((x - radius) < 0) {
      xes.push(x + width)
    }
    if ((x + radius) > width) {
      xes.push(x - width)
    }

    if (0 < x && x < width) {
      xes.push(x)
    }

    let yes = []
    if ((y - radius) < 0) {
      yes.push(y + height)
    }
    if ((y + radius) > height) {
      yes.push(y - height)
    }

    if (0 < y && y < height) {
      yes.push(y)
    }

    xes.forEach(xx => {
      yes.forEach(yy => {
        dots.push([xx, yy])
      })
    })
  }

  dots.forEach(e => {
    xx = other.center.x - e[0]
    yy = other.center.y - e[1]
    let ooo = xx * xx  + yy * yy
    minDistance = min(minDistance, ooo)
    comparisions++
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
  if (0 <= mouseX && mouseX <= width && 0 <= mouseY && mouseY <= height) {

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


function realignVector(vector) {
  let newCoords = getCoordinates(...vector.array())
  vector.set(...newCoords)
}