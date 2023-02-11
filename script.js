width = 512
height = 512

dt = 0.001

t = 0

function dist(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2))
}

function findatloc(x, y) {
    for (let i = 0; i < entities.length; i++) {
        d = dist(x, y, entities[i].x, entities[i].y)
        if (d < entities[i].radius) {
            return entities[i]
        }
    }
    return "Fail"
}

class Entity {
    constructor(x, y, radius) {
        this.x = x;
        this.y = y;
        this.lx = x;
        this.ly = y;
        this.accx = 0;
        this.accy = 0;
        this.radius = radius;
        this.links = []
        this.fill = [255, 128, 128]
        this.fixed = false
    }

    link(other) {
        this.links.push(other)
        other.links.push(this)
    }

    substep() {
        if (this.x + this.radius > height) {
            this.x -= (this.x + this.radius - width)
        }
        if (this.y + this.radius > height) {
            this.y -= (this.y + this.radius - height)
        }
        if (this.x - this.radius < 0) {
            this.x -= (this.x - this.radius)
        }
        if (this.y - this.radius < 0) {
            this.y -= (this.y - this.radius)

        }
        if (this.links.length > 0) {
            this.fill[2] = 255
        }else {
            this.fill[2] = 128
        }
        for (let i = 0; i < entities.length; i++) {
            if (entities[i] !== this && this.fixed == false) {
                let odist = dist(this.x, this.y, entities[i].x, entities[i].y)
                let overlap = odist - (this.radius + entities[i].radius)
                if (overlap < 0) {

                    let d = this.radius + entities[i].radius - odist

                    this.x += ((this.x - entities[i].x) / odist) * d * 0.5
                    this.y += ((this.y - entities[i].y) / odist) * d * 0.5
                    if (entities[i].fixed == false) {
                        entities[i].x -= ((this.x - entities[i].x) / odist) * d * 0.5
                        entities[i].y -= ((this.y - entities[i].y) / odist) * d * 0.5
                    }

                }
                if (overlap * this.radius < -500 && false) {
                    entities.splice(entities.indexOf(this), 1)
                    entities.push(new Entity(this.x + this.radius/2, this.y + this.radius/2, this.radius / 2))
                    entities.push(new Entity(this.x - this.radius/2, this.y - this.radius/2, this.radius / 2))
                    return 0
                }
            }
        }
    }

    update() {

        if (this.fixed == false) {

            for (let i = 0; i < this.links.length; i++) {
                if (this.links[i] !== undefined) {
                    let other = this.links[i]
                    let d = dist(this.x, this.y, other.x, other.y)
                    //console.log(((other.x - this.x) * d))
                    if (!other.fixed) {
                        other.x -= ((other.x - this.x) * d) / 1000
                        other.y -= ((other.y - this.y) * d) / 1000
                    }
    
                        this.x += ((other.x - this.x) * d) / 1000
                        this.y += ((other.y - this.y) * d) / 1000
    
                }
    
            }
        
        this.accelerate(0, 0.1)//Math.cos(t / 10000) * 800)

 
        t += 1
        for (let i = 0; i < 4; i++) {
            this.substep();
        }

        let velx = (this.x - this.lx) * 0.99;
        let vely = (this.y - this.ly) * 0.99;

        this.fill[0] = dist(this.x, this.y, this.lx, this.ly) * 32

        this.lx = this.x;
        this.ly = this.y;

        this.x += velx + this.accx;
        this.y += vely + this.accy;

        this.accx = 0;
        this.accy = 0;
        } else {
            this.fill = [128, 128, 128]
        }

    }

    accelerate(x, y) {
        this.accx += x
        this.accy += y 
    }
    
}



function mouseWheel() {
    if (keyIsDown(SHIFT)) {
        entities.push(new Entity(mouseX, mouseY, 10));

    }
}
let mousedown = false
let selected = new Entity(width/2, height/2, 10)

function mousePressed() {
    if (keyIsDown(SHIFT)) {
        let loc = findatloc(mouseX, mouseY)
        if (loc != "Fail") {
            loc.fixed = !loc.fixed
        }
    } else {
        mousedown = true
        let loc = findatloc(mouseX, mouseY)
        if (loc != "Fail") {
            selected = loc
        }
    }
}

function mouseReleased() {
    mousedown = false
}

function keyPressed() { 
    if (entities.length > 2 && !keyIsDown(SHIFT)) {
        try {
            rentry = Math.round(Math.random() * entities.length) - 2
            entities[rentry].link(entities[rentry + 1])
        } catch {
            0;
        }
    }
}


function render() {
    if (mousedown) {
        if (findatloc(mouseX, mouseY) == selected) {
            selected.x = mouseX
            selected.y = mouseY
        }
    }

    for (let i = 0; i < entities.length; i++) {

        let e = entities[i]
        fill(e.fill[0], e.fill[1], e.fill[2]);
        noStroke()
        circle(e.x, e.y, e.radius * 2);
        if (e.links.length > 0) {
            stroke(255)
            for(let i = 0; i < e.links.length; i++) {
                line(e.x, e.y, e.links[i].x, e.links[i].y)
            }
        }
        entities[i].update()
    }
}

function setup() {
    createCanvas(512, 512);
    entities = [];
    entities.push(selected)
}

function draw() {
    background(0);
    render();
    textSize(32);
    fill(255, 255, 255)
    text(Math.round(frameRate()), 10, 30);

}
