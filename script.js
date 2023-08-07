width = 1024
height = 512

t = 0

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

let mouseX = 0
let mouseY = 0

let key = ""
let g = 0.1
let maxStress = 100
let linkStrength = 1

let barriers = []

lastTime = 0

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

class FixedRect {
    constructor(x, y, w, h, draggable = false) {
        this.x = x
        this.y = y
        this.w = w
        this.h = h
        this.draggable = draggable
        this.beingDragged = false
        this.startDragMouseX = 0
        this.startDragMouseY = 0
    }
    overlaps(x, y, r) {
        let xoff = 0
        let yoff = 0

        let leftXoff = Math.max((x + r) - this.x, 0)
        let rightXoff = Math.min((x - r) - (this.x + this.w), 0)
        let topYoff = Math.max((y + r) - this.y, 0)
        let bottomYoff = Math.min((y - r) - (this.y + this.h), 0)
        console.log(leftXoff, rightXoff, topYoff, bottomYoff)
        if (Math.abs(leftXoff) < Math.abs(rightXoff)) {
            xoff = leftXoff
        } else {
            xoff = rightXoff
        }
        if (Math.abs(topYoff) < Math.abs(bottomYoff)) {
            yoff = topYoff
        } else {
            yoff = bottomYoff
        }

        if (Math.abs(xoff) < Math.abs(yoff)) {
            yoff = 0
        } else {
            xoff = 0
        }
    
        return [xoff, yoff]
    }
    update() {
        if (this.draggable) {
            let overlap = this.overlaps(mouseX, mouseY, 0)
            if ((overlap[0] !== 0 || overlap[1] !== 0) && mousedown) {
                if (this.beingDragged == false) {
                    this.startDragMouseX = mouseX - this.x
                    this.startDragMouseY = mouseY - this.y
                }
                this.beingDragged = true
                this.x = mouseX - this.startDragMouseX
                this.y = mouseY - this.startDragMouseY
            } else {
                this.beingDragged = false
            }
        }
    }
}

class Entity {
    constructor(x, y, radius) {
        this.x = x
        this.y = y
        this.lx = x
        this.ly = y
        this.accx = 0
        this.accy = 0
        this.radius = radius
        this.links = []
        this.fill = [255, 128, 128]
        this.fixed = false
        this.avgStress = 0
    }

    link(other) {
        if (other !== this) {
            if (this.links.indexOf(other) == -1) {
                this.links.push(other)
            }
            if (other.links.indexOf(this) == -1) {
                other.links.push(this)
            }
        }
    }

    substep() {
        if (this.x + this.radius > width) {
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
            }
        }
        for (let i = 0; i < barriers.length; i++) {
             let [xoff, yoff] = barriers[i].overlaps(this.x, this.y, this.radius)
                this.x -= xoff
                this.y -= yoff
            
        }
    }

    update() {

            for (let i = 0; i < this.links.length; i++) {
                if (this.links[i] !== undefined) {
                    let other = this.links[i]
                    let stress = dist(this.x, this.y, other.x, other.y)
                    if (stress < maxStress) {
                        if (!this.fixed) {
                            if (!other.fixed) {
                                other.x -= ((other.x - this.x) * stress) * linkStrength / 1000
                                other.y -= ((other.y - this.y) * stress) * linkStrength / 1000
                                this.x += ((other.x - this.x) * stress)  * linkStrength / 1000
                                this.y += ((other.y - this.y) * stress)  * linkStrength / 1000
                            } else {
                                this.x += ((other.x - this.x) * stress) * linkStrength / 500
                                this.y += ((other.y - this.y) * stress) * linkStrength / 500
                            }
                        }
                    } else {
                        this.links.splice(this.links.indexOf(other), 1)
                        other.links.splice(other.links.indexOf(this), 1)
                    }
                    }
    
            }
        
        if (this.fixed == false) {
            this.accelerate(0, g)

    
            t += 1
            for (let i = 0; i < 8; i++) {
                this.substep();
            }

            let velx = (this.x - this.lx) * 0.95;
            let vely = (this.y - this.ly) * 0.95;

            this.fill[0] = dist(this.x, this.y, this.lx, this.ly) * 20

            this.lx = this.x;
            this.ly = this.y;

            this.x += Math.min(velx + this.accx, 30);
            this.y += Math.min(vely + this.accy, 30);

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



canvas.addEventListener("mousemove", function(e) {
    let rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left,
      mouseY = e.clientY - rect.top
})

let mousedown = false
let selected = new Entity(width/2, height/2, 10)

canvas.addEventListener("mousedown", function(e) {
    if (key == "Shift") {
        let loc = findatloc(mouseX, mouseY)
        if (loc != "Fail") {
            loc.lx = loc.x
            loc.ly = loc.y
            loc.fixed = !loc.fixed
        }
    } else if (key == "Control") {
        let canPlace = true
        for (let i = 0; i < barriers.length; i++) {
            let overlap = barriers[i].overlaps(mouseX, mouseY, 0)
            if (overlap[0] != 0 || overlap[1] != 0) {
                canPlace = false
            }
        }
        console.log(canPlace)
        if (canPlace) entities.push(new Entity(mouseX + Math.random(), mouseY + Math.random(), 10));
}    else {
        mousedown = true
        let loc = findatloc(mouseX, mouseY)
        if (loc != "Fail") {
            selected = loc
        }
    }
})

function mouseReleased() {
    mousedown = false
}

addEventListener("keydown", function(e) {
    key = e.key
    if (entities.length > 1 && key == "e") {
        try {
            oentry = findatloc(mouseX, mouseY)
            if (oentry !== "Fail") {
                oentry.link(selected)
                selected = oentry
            }
        } catch {
            0;
        }
    } else if (entities.length > 1 && key == "d") {
        oentry = findatloc(mouseX, mouseY)
        if (oentry !== "Fail") {
            for (let i = 0; i < oentry.links.length; i++) {
                oentry.links[i].links.splice(oentry.links[i].links.indexOf(oentry), 1)
            }
            entities.splice(entities.indexOf(oentry), 1)
        }
    }
})

addEventListener("keyup", function(e) {
    key = ""
})

addEventListener("mouseup", function(e) {
    mousedown = false
})

function render() {
    if (mousedown) {
        selected.x = mouseX
        selected.y = mouseY
    }

    for (let i = 0; i < entities.length; i++) {

        let e = entities[i]
        ctx.fillStyle = "rgb(" + e.fill[0] + "," + e.fill[1] + "," + e.fill[2] + ")";
        if (e == selected) {
            ctx.strokeStyle = "rgb(255, 0, 0)"
        } else if (e == findatloc(mouseX, mouseY)) {
            ctx.strokeStyle = "rgb(0, 255, 0)"
        } else {
            ctx.strokeStyle = "rgb(0, 0, 0)"
        }
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.radius, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();

        if (e.links.length > 0) {
            for(let i = 0; i < e.links.length; i++) {
                stressRatio = maxStress/dist(e.x, e.y, e.links[i].x, e.links[i].y)
                ctx.lineWidth = Math.min((stressRatio) + 3, 4);
                ctx.strokeStyle = `rgb(${255 - ((stressRatio * 0.25) * 150)}, 100, 100)`;
                ctx.beginPath();
                ctx.moveTo(e.x, e.y);
                ctx.lineTo(e.links[i].x, e.links[i].y);
                ctx.stroke();
                ctx.lineWidth = 2;
            }
        }
        entities[i].update()
    }
    ctx.strokeStyle = "rgb(0, 0, 0)"
    ctx.lineWidth = 0;
    for (let i = 0; i < barriers.length; i++) {
        ctx.fillStyle = "rgb(0, 0, 0)";
        ctx.fillRect(barriers[i].x, barriers[i].y, barriers[i].w, barriers[i].h);
        barriers[i].update()
    }
}

function frameRate() {
    let now = Date.now();
    let frameRate = 1000 / (now - lastTime);
    lastTime = now;
    return frameRate;
}

function setup() {
    entities = [];
    entities.push(selected)
    barriers.push(new FixedRect(0, height-300, 300, 300))
    barriers.push(new FixedRect(width-300, height-300, 300, 300))
    barriers.push(new FixedRect(width/2-150, height-300, 300, 300, true))
}

function draw() {
    g = document.getElementById("gravity").value * 1
    maxStress = document.getElementById("maxStress").value * 1
    linkStrength = document.getElementById("linkStrength").value * 1
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "rgb(45, 45, 55)";
    ctx.fillRect(0, 0, width, height);
    render();
    ctx.font = "30px Monospace";
    ctx.fillStyle = "white";
    ctx.fillText(Math.round(frameRate()), 10, 30);

    window.requestAnimationFrame(draw);
}


setup()
draw()