function mx(vec){
  return max(max(vec.x, vec.y), vec.z)
}

class Robot{
  constructor(){
    this.position = new p5.Vector(0, 0, 0); // x, y, theta
    this.velocity = new p5.Vector(0, 0, 0);
    
    this.relativePosition = new p5.Vector(0, -HALF_PI) // V, w
    this.relativeVelocity = new p5.Vector(5, 0.01)
    
    this.wheelPosition = new p5.Vector(0, 0) // L, R
    this.wheelVelocity = new p5.Vector(0, 0)
   
    this.wheelWidth = 10
    this.interWheelDistance = 30
    this.wheelRadius = 10
    this.wheelCircumference = TWO_PI * this.wheelRadius
  }
  
  tickWheel(dt){
    let wv = p5.Vector.mult(this.wheelVelocity, dt)
    if (mx(wv) > 0.2) return false;
    this.wheelPosition.add(wv)
    // this.wheelVelocity.mult(0.99)
    
    this.relativeVelocity = new p5.Vector(
      this.wheelCircumference * (this.wheelVelocity.x + this.wheelVelocity.y) / 2,
      this.wheelCircumference * (this.wheelVelocity.x - this.wheelVelocity.y) / this.interWheelDistance
    )
    this.relativePosition.add(p5.Vector.mult(this.relativeVelocity,  dt))
    
    
    this.velocity = new p5.Vector(
      this.relativeVelocity.x * cos(this.relativePosition.y),
      this.relativeVelocity.x * sin(this.relativePosition.y),
      this.relativeVelocity.y
    )
    this.position.add(p5.Vector.mult(this.velocity, dt));
    return true;
  }
  
  
  tickRelative(){
    this.relativePosition.add(this.relativeVelocity)
    this.relativeVelocity.mult(0.99)
    
    this.velocity = new p5.Vector(
      this.relativeVelocity.x * cos(this.relativePosition.y),
      this.relativeVelocity.x * sin(this.relativePosition.y),
      this.relativeVelocity.y
    )
    this.position.add(this.velocity);
  }
  
  tickWorld(){
    this.position.add(this.velocity);
    this.velocity.mult(0.99);
  }
  
  render(){
    {
      push()
      translate(this.position.x,  this.position.y)
      rotate(this.position.z)
      circle(0, 0, 50)
      circle(0, 0, 5)
      {
        push()
        translate(-(this.interWheelDistance + this.wheelWidth) / 2, -this.wheelRadius)
        rect(0, 0, this.wheelWidth, 2 * this.wheelRadius)
        circle(this.wheelWidth / 2, this.wheelRadius, 5)
        pop()
      }
      {
        push()
        circle(0, 0, 5)
        translate((this.interWheelDistance + this.wheelWidth) / 2, this.wheelRadius)
        rect(0, 0, -this.wheelWidth, -2 * this.wheelRadius)
        circle(-this.wheelWidth / 2, -this.wheelRadius, 5)
        pop()
      }
      pop()
    }
  }
  
  debug(){
    text("X: " + this.position.x, 0, 10)
    text("Y: " + this.position.y, 0, 20)
    text("T: " + this.position.z, 0, 30)
    
    text("V: " + this.relativePosition.x, 0, 50)
    text("W: " + this.relativePosition.y, 0, 60)
    
    text("L: " + this.wheelPosition.x, 0, 80)
    text("R: " + this.wheelPosition.y, 0, 90)
    
    text("X: " + this.velocity.x, 0, height-80)
    text("Y: " + this.velocity.y, 0, height-70)
    text("T: " + this.velocity.z, 0, height-60)
    
    text("V: " + this.relativeVelocity.x, 0, height-40)
    text("W: " + this.relativeVelocity.y, 0, height-30)
    
    text("L: " + this.wheelVelocity.x, 0, height-10)
    text("R: " + this.wheelVelocity.y, 0, height-0)
    
  }
  
}

let robot;
let leftSpeed;
let rightSpeed;
let simulationSpeed;
let framesPerTick;
let doRender;

function setup() {
  angleMode(RADIANS)
  frameRate(144)
  createElement("span", "Left Speed")
  leftSpeed = createSlider(-1, 1, 0, 0.02)
  createElement("span", "Right Speed")
  rightSpeed = createSlider(-1, 1, 0.02, 0.02)
  createElement("span", "Simulation Speed")
  simulationSpeed = createSlider(-5, 1, -1, 0.01)
  createElement("span", "Ticks per frame")
  framesPerTick = createSlider(0, (2**22) / getTargetFrameRate(), 1024, 1)
  doRender = createCheckbox("Do Render", true);
  createCanvas(windowWidth, windowHeight - 70);
  robot = new Robot();
  textFont('Courier New');

}

function draw() {
  robot.wheelVelocity.x = leftSpeed.value()
  robot.wheelVelocity.y = rightSpeed.value()
  let dt = deltaTime * pow(10, simulationSpeed.value());
  for (let i=0; i<framesPerTick.value(); i++){
    let dtItem = dt / framesPerTick.value()
    if (dtItem > 10){
      break
    }
    let result = robot.tickWheel(dtItem);
    if (!result){
      console.log("Skipped tick")
    }
  }
    clear()
    if (doRender.checked())
  {
    push()
    translate(width/2, height/2)
    background(220);
    
    robot.render()
    point(0, 0)
    pop()
  }
  robot.debug()
  let w = width - 100;
  text("Frame: " + frameCount, w, 10)
  text("speed: " + simulationSpeed.value(), w, 20)  
  text("dt   : " + dt, w, 30)
  text("ticks: " + framesPerTick.value(), w, 40)
  text("FPS  : " + frameRate(), w, 50)
  
}