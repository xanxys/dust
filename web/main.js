"use strict";
import {Vec2, AABB} from "./math.js";

const size = 128;
const world = new Uint8Array(size * size);


function redraw(scale, origin, box) {
    let canvas = document.getElementById("main");
    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (box !== null) {
        ctx.strokeStyle = "rgba(0, 0, 0, 0.5)";
        ctx.lineWidth = 1;
        ctx.rect(box.p0.x, box.p0.y, box.p1.x - box.p0.x, box.p1.y - box.p0.y);
        ctx.stroke();
    }

    ctx.save();
    ctx.translate(origin.x, origin.y);
    ctx.scale(scale, scale);

    for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            const v = world[i + size * j];
            ctx.fillStyle = `rgba(${v},${v},${v}, 1)`;
            ctx.fillRect(i, j, 1, 1);
        }
    }

    ctx.restore();

    $("#label_rule").text("");
}

function cleanParticles() {
    world.fill(0);
}

function addRandom(num) {
    for (let i = 0; i < size * size; i++) {
        if (Math.random() < 0.3) {
            world[i] = Math.floor(Math.random() * 255);
        } else {
            world[i] = 0;
        }
        
    }
}

function hamming(x, y) {
    return bitcount8(x ^ y);
}

function bitcount8(x) {
    x = ((x & 0b10101010) >> 1) + (x & 0b01010101);
    x = ((x & 0b11001100) >> 2) + (x & 0b00110011);
    x = ((x & 0b11110000) >> 4) + (x & 0b00001111);
    return x;
}

function addPatternsRandomly(pat, num) {
}

function energy(x, y) {
    const xm = (x + size - 1) % size;
    const xp = (x + 1) % size;
    const ym = (y + size - 1) % size;
    const yp = (y + 1) % size;

    const v = world[x + y * size];
    const vxm = world[xm + y * size];
    const vxp = world[xp + y * size];
    const vym = world[x + ym * size];
    const vyp = world[x + yp * size];

    return hamming(v, vxm) + hamming(v, vxp) + hamming(v, vym) + hamming(v, vyp);
}

function swap(ix0, ix1) {
    const t = world[ix1];
    world[ix1] = world[ix0];
    world[ix0] = t;
}

function step() {
    for (let microstep = 0; microstep < size * size; microstep++) {
        const x = Math.floor(size * Math.random());
        const y = Math.floor(size * Math.random());

        let xp, yp;
        if (Math.random() > 0.5) {
            // horizontal swap
            xp = (x + 1) % size;
            yp = y;
        } else {
            // vertical swap
            xp = x;
            yp = (y + 1) % size;
        }

        const energyPre = energy(x, y) + energy(xp, yp);
        const ix0 = x + size * y;
        const ix1 = xp + size * yp;
        swap(ix0, ix1);
        const energyPost = energy(x, y) + energy(xp, yp);
        const deltaE = energyPost - energyPre;
        const probAccept = deltaE < 0 ? 1 : Math.exp(-deltaE / 10);

        if (1 - probAccept >= Math.random()) {
            // revert swap
            swap(ix0, ix1);
        }
    }
}

function getParticlesIn(box) {
    return [];
}

function main() {
    const vm = new Vue({
        el: "#app",
        data: {
            interval: null,
            tick: 0,
            numParticles: 0,

            // viewport
            viewportScale: 10, // px/space
            viewportOrigin: new Vec2(0, 0), // px

            // drag control
            captureMode: false,
            dragging: false,
            prevPos: new Vec2(0, 0),
            selectionBox: null,
        },
        methods: {
            toSpace: function(pCanvas) {
                return pCanvas.clone().sub(this.viewportOrigin).mult(1 / this.viewportScale);
            },
            dragStart: function(ev) {
                this.dragging = true;
                this.prevPos = new Vec2(ev.clientX, ev.clientY);
            },
            dragStop: function() {
                this.dragging = false;
                if (this.captureMode) {
                    // actually capture
                    const selectionSp = new AABB(this.toSpace(this.selectionBox.p0), this.toSpace(this.selectionBox.p1));
                    console.log("capture", getParticlesIn(selectionSp));
                    
                    this.selectionBox = null;
                    this.captureMode = false;
                }
                this.redraw();
            },
            drag: function(ev) {
                if (!this.dragging) {
                    return;
                }

                const currPos = new Vec2(ev.clientX, ev.clientY);
                if (this.captureMode) {
                    // capture: specify box
                    this.selectionBox = new AABB(this.prevPos, currPos);
                } else {
                    // normal: move canvas
                    const dx = ev.clientX - this.prevPos.x;
                    const dy = ev.clientY - this.prevPos.y;
                    this.viewportOrigin = new Vec2(this.viewportOrigin.x + dx, this.viewportOrigin.y + dy);
                    this.prevPos = currPos;
                }

                this.redraw();
            },
            clean: function() {
                cleanParticles();
                this.tick = 0;
                this.redraw();
            },
            addRandom: function(num) {
                addRandom(num);
                this.redraw();
            },
            addGlider1: function(num) {
                addPatternsRandomly(glider1, num);
                this.redraw();
            },
            addPuffer1: function(num) {
                addPatternsRandomly(puffer1, num);
                this.redraw();
            },
            addPuffer2: function(num) {
                addPatternsRandomly(puffer2, num);
                this.redraw();
            },
            redraw: function() {
                this.numParticles = 0;
                redraw(this.viewportScale, this.viewportOrigin, this.selectionBox);
            },
            zoom: function(ev) {
                ev.preventDefault();

                // p = event.offsetX,Y must be preserved.
                // p<canvas> = p<space> * zoom + t = p<ECA> * new_zoom + new_t
                var centerXSp = (ev.offsetX - this.viewportOrigin.x) / this.viewportScale;
                var centerYSp = (ev.offsetY - this.viewportOrigin.y) / this.viewportScale;
                this.viewportScale = Math.min(50, Math.max(2, this.viewportScale * (1 - ev.deltaY * 0.002)));

                this.viewportOrigin.x = ev.offsetX - centerXSp * this.viewportScale;
                this.viewportOrigin.y = ev.offsetY - centerYSp * this.viewportScale;

                this.redraw();
            },
            startStepping: function() {
                if (this.interval !== null) {
                    return;
                }
                this.interval = setInterval(() => {
                    step();
                    this.tick += 1;
                    this.redraw();
                }, 50);    
            },
            stopStepping: function() {
                if (this.interval === null) {
                    return;
                }
                clearInterval(this.interval);
                this.interval = null;
            },
            clickStep: function() {
                step();
                this.tick += 1;
                this.redraw();
            },
            clickTogglePlaying: function() {
                if (this.interval === null) {
                    this.startStepping();
                } else {
                    this.stopStepping();
                }
            },
            clickCapture: function() {
                this.dragging = false;
                this.stopStepping();
                this.captureMode = true;
            },
        },
    });

    cleanParticles();
    addRandom();
    vm.startStepping();
}

main();
