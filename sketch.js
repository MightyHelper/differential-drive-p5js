function mx(vec) {
  return max(max(vec.x, vec.y), vec.z);
}

class Robot {
  constructor() {
    this.position = new p5.Vector(0, 0, 0); // x, y, theta
    this.velocity = new p5.Vector(0, 0, 0);

    this.relativePosition = new p5.Vector(0, -HALF_PI); // V, w
    this.relativeVelocity = new p5.Vector(5, 0.01);

    this.wheelPosition = new p5.Vector(0, 0); // L, R
    this.wheelVelocity = new p5.Vector(0, 0);

    this.wheelWidth = 10;
    this.interWheelDistance = 100;
    this.wheelRadius = 30;
    this.wheelCircumference = TWO_PI * this.wheelRadius;
  }

  tickWheel(dt) {
    let wv = p5.Vector.mult(this.wheelVelocity, dt);
    if (mx(wv) > 0.2) return false;
    this.wheelPosition.add(wv);
    // this.wheelVelocity.mult(0.99)

    this.relativeVelocity = new p5.Vector(
      (this.wheelCircumference *
        (this.wheelVelocity.x + this.wheelVelocity.y)) /
        2,
      (this.wheelCircumference *
        (this.wheelVelocity.x - this.wheelVelocity.y)) /
        this.interWheelDistance
    );
    this.relativePosition.add(p5.Vector.mult(this.relativeVelocity, dt));

    this.velocity = new p5.Vector(
      this.relativeVelocity.x * cos(this.relativePosition.y),
      this.relativeVelocity.x * sin(this.relativePosition.y),
      this.relativeVelocity.y
    );
    this.position.add(p5.Vector.mult(this.velocity, dt));
    return true;
  }

  tickRelative() {
    this.relativePosition.add(this.relativeVelocity);
    this.relativeVelocity.mult(0.99);

    this.velocity = new p5.Vector(
      this.relativeVelocity.x * cos(this.relativePosition.y),
      this.relativeVelocity.x * sin(this.relativePosition.y),
      this.relativeVelocity.y
    );
    this.position.add(this.velocity);
  }

  tickWorld() {
    this.position.add(this.velocity);
    this.velocity.mult(0.99);
  }

  render(graphics) {
    // 2D render logic
    graphics.push();
    graphics.translate(this.position.x, this.position.y);
    graphics.rotate(this.position.z);
    graphics.circle(0, 0, this.interWheelDistance);
    graphics.circle(0, 0, 5);

    // Left wheel
    graphics.push();
    graphics.translate(
      -(this.interWheelDistance + this.wheelWidth) / 2,
      -this.wheelRadius
    );
    graphics.rect(0, 0, this.wheelWidth, 2 * this.wheelRadius);
    graphics.circle(this.wheelWidth / 2, this.wheelRadius, 5);
    graphics.pop();

    // Right wheel
    graphics.push();
    graphics.circle(0, 0, 5);
    graphics.translate(
      (this.interWheelDistance + this.wheelWidth) / 2,
      this.wheelRadius
    );
    graphics.rect(0, 0, -this.wheelWidth, -2 * this.wheelRadius);
    graphics.circle(-this.wheelWidth / 2, -this.wheelRadius, 5);
    graphics.pop();

    graphics.pop();
  }

  render3d(graphics) {
    // 3D render logic
    graphics.push();
    graphics.translate(this.position.x, this.position.y, this.wheelRadius);
    graphics.rotateZ(this.position.z);

    graphics.push();
    graphics.rotateX(HALF_PI);
    // graphics.fill(255, 255, 255, 100)
    // Draw a simple 3D robot body
    graphics.cylinder(this.interWheelDistance / 2, 5); // Representing the robot body
    graphics.pop();

    // Left wheel (in 3D)
    graphics.push();
    graphics.translate(-(this.interWheelDistance) / 2, 0, 0);
    graphics.rotateZ(HALF_PI);
    graphics.rotateY(-this.wheelPosition.x * PI);
    graphics.cylinder(this.wheelRadius, this.wheelWidth); // Representing wheel
    graphics.pop();

    // Right wheel (in 3D)
    graphics.push();
    graphics.translate((this.interWheelDistance) / 2, 0, 0);
    graphics.rotateZ(HALF_PI);
    graphics.rotateY(-this.wheelPosition.y * PI);
    graphics.cylinder(this.wheelRadius, this.wheelWidth); // Representing wheel
    graphics.pop();

    graphics.pop();
  }

  debug() {
    text("X: " + this.position.x, 0, 10);
    text("Y: " + this.position.y, 0, 20);
    text("T: " + this.position.z, 0, 30);

    text("V: " + this.relativePosition.x, 0, 50);
    text("W: " + this.relativePosition.y, 0, 60);

    text("L: " + this.wheelPosition.x, 0, 80);
    text("R: " + this.wheelPosition.y, 0, 90);

    text("X: " + this.velocity.x, 0, height - 80);
    text("Y: " + this.velocity.y, 0, height - 70);
    text("T: " + this.velocity.z, 0, height - 60);

    text("V: " + this.relativeVelocity.x, 0, height - 40);
    text("W: " + this.relativeVelocity.y, 0, height - 30);

    text("L: " + this.wheelVelocity.x, 0, height - 10);
    text("R: " + this.wheelVelocity.y, 0, height - 0);
  }
}

let robot;
let leftSpeed;
let rightSpeed;
let simulationSpeed;
let framesPerTick;
let doRender;
let doWebGL = false;
let world2d;
let world3d;
let worldGraphics;
let cam;
let sensitivityX = 0.01;
let sensitivityY = 0.01;
let sensitivityZ = 0.01;
let scaleFactor = 1;
let world2dScale = 1;
let keyboardControls;
let friction;

function setup() {
  angleMode(RADIANS);
  frameRate(144);
  createElement("span", "Left Speed");
  leftSpeed = createSlider(-1, 1, 0, 0.0);
  createElement("span", "Right Speed");
  rightSpeed = createSlider(-1, 1, 0.02, 0.0);
  createElement("span", "Simulation Speed");
  simulationSpeed = createSlider(-5, 1, -2, 0.01);
  createElement("span", "Ticks per frame");
  framesPerTick = createSlider(0, 2 ** 22 / getTargetFrameRate(), 1024, 1);
  friction = createSlider(-3, 0, 0, 0.5)
  createElement("span", "Friction-ish");
  doRender = createCheckbox("Do Render", true);
  doWebGL = createCheckbox("Do WebGL", false);
  keyboardControls = createCheckbox("Use keyboard", true);
  createCanvas(windowWidth, windowHeight - 110);
  world2d = createGraphics(width, height, P2D);
  world3d = createGraphics(width, height, WEBGL);
  doWebGL.elt.addEventListener('change', () => {
    worldGraphics = doWebGL.checked() ? world3d : world2d;
  })
  keyboardControls.elt.addEventListener('change', () => {
    if (keyboardControls.checked()){
      leftSpeed.elt.step = 0.000001
      rightSpeed.elt.step = 0.000001
    }else{
      leftSpeed.elt.step = 0.02
      rightSpeed.elt.step = 0.02
    }
    
  })
  
  worldGraphics = doWebGL.checked() ? world3d : world2d;
  
  cam = world3d.createCamera();
  robot = new Robot();
  textFont("Courier New");
}
function mouseDragged() {
  // I'm only implementing orbit and zoom here, but you could implement
  // panning as well.

  // Technically _orbit is not a publicly documented part of the
  // p5.Camera API. I will leave it as an excersise to the reader to
  // re-implement this functionality via the public API.

  // The _orbit function updates the Euler angles for the position of
  // the camera around the target towards which it is oriented, and
  // adjusts its distance from the target.

  if (mouseX < width && mouseX > 0 && mouseY < height && mouseY > 0) {
    const deltaTheta = (-sensitivityX * (mouseX - pmouseX)) / scaleFactor;
    const deltaPhi = (sensitivityY * (mouseY - pmouseY)) / scaleFactor;
    cam._orbit(deltaTheta, deltaPhi, 0);
  }
}

function mouseWheel(event) {
  if (doWebGL.checked()){
    if (event.delta > 0) {
      cam._orbit(0, 0, sensitivityZ * scaleFactor);
    } else {
      cam._orbit(0, 0, -sensitivityZ * scaleFactor);
    }
  }else{
    world2dScale *= event.delta > 0 ? 0.99 : 1.01;
  }
  
}

function draw() {
  robot.wheelVelocity.x = leftSpeed.value();
  robot.wheelVelocity.y = rightSpeed.value();
  let dt = deltaTime * pow(10, simulationSpeed.value());
  for (let i = 0; i < framesPerTick.value(); i++) {
    let dtItem = dt / framesPerTick.value();
    if (dtItem > 10) {
      break;
    }
    let result = robot.tickWheel(dtItem);
    if (!result) {
      console.log("Skipped tick");
    }
  }
  clear();
  if (doRender.checked()) {
    worldGraphics.clear();
    worldGraphics.push();
    worldGraphics.background(220);
    if (doWebGL.checked()) {
      // Render floor

      worldGraphics.rotateX(HALF_PI)
      worldGraphics.box(1000, 1000, 0);

      robot.render3d(worldGraphics);
      worldGraphics.orbitControl();
    } else {
      worldGraphics.translate(width / 2, height / 2);
      worldGraphics.scale(world2dScale)
      robot.render(worldGraphics);
    }
    worldGraphics.point(0, 0);
    worldGraphics.pop();
  }
  image(worldGraphics, 0, 0);
  robot.debug();
  let w = width - 100;
  text("Frame: " + frameCount, w, 10);
  text("speed: " + simulationSpeed.value(), w, 20);
  text("dt   : " + dt, w, 30);
  text("ticks: " + framesPerTick.value(), w, 40);
  text("FPS  : " + frameRate(), w, 50);
  text("2dScale:" + world2dScale, w, 60);
  let wz = w;
  if (keyboardControls.checked()){
    let w = keyIsDown('W'.charCodeAt(0)) ? 1 : 0;
    let a = keyIsDown('A'.charCodeAt(0)) ? 1 : 0;
    let s = keyIsDown('S'.charCodeAt(0)) ? 1 : 0;
    let d = keyIsDown('D'.charCodeAt(0)) ? 1 : 0;
    text("w:" + w, wz, 70);
    text("a:" + a, wz, 80);
    text("s:" + s, wz, 90);
    text("d:" + d, wz, 100);
    let z = 0.1
    let f = w * z + s * -z
    let l = d * z + a * -z
    let fr = pow(10, friction.value())
    text("Fr:" + fr, wz, 110);
    let fri = 1 - fr
    leftSpeed.elt.value = parseFloat(leftSpeed.elt.value) * fri + (f + l) * fr;
    rightSpeed.elt.value = parseFloat(rightSpeed.elt.value) * fri + (f - l) * fr;
  }
}

