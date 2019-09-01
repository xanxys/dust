"use strict";

let particles = [];

const deg_split = 1;
const deg_split2 = 2;

const deg_kill_lower = 0;
const deg_kill_upper = 5;

/*
I: stable
II: repetitive
III: chaotic
IV: edge of chaos

-- SPL=REFLECT-a

S=1,2 K=0,>=5
 
S=1,3 K=0,>=5
 0.95

Search good a.


-- SPL=REFLECT-HALF (K=0)
S=1 K>=2,3,4,5: I
S=1,2 K>=4: I+glider


-- SPL=REFLECT
S=1 K>=2: I
S=1 K>=3: I
S=1 K>=4: I

* S=2 K>=3: I, III, potentially IV, rare gliders
S=2 K>=4: III, monotonic expansion of III region
S=2 K>=5: III, gliders often exist, but destroyed by III region

S=1,2 K>=3: III
S=1,2 K>=4: III
S=1,2 K>=5: III

S=1,3 K>=4: multiscale III, too much garbage remaining
S=1,3 K>=5: III
S=1,3 K>=6: III, (IV), big glider destroyed by III region

S=2,3 K>=4: III
S=2,3 K>=5: III, linear glider destroyed by III region
S=2,3 K>=6: III

-- SPL=REFLECT (K=0)
S=1 K>=2: I, nothing
S=1 K>=3: I, stable triangles
S=1 K>=4: I, stable meshes
S=1 K>=5: I, stable meshes

S=2 K>=3: III -> I
S=2 K>=4: III, monotonic expansion of chaotic region
S=2 K>=5: III, monotonic expansion of chaotic region + quick-dying puffers

S=1,2 K>=3: III -> I
S=1,2 K>=4: III -> I
* S=1,2 K>=5: often I, II, Potentially IV
S=1,2 K>=6: III -> I, mesh remains

S=1,3 K>=4: III -> I
* S=1,3 K>=5: Potential IV, ladder-like puffer
S=1,3 K>=6: III, micro+mesoscale III

S=2,3 K>=4: III, (IV), ocassional ladder-glider destroyed by III region
S=2,3 K>=5: III, (IV), ocassional ladder-glider destroyed by III region
S=2,3 K>=6: III

-- SPL=REFLECT (K=1)
S=2 K>=3: I
S=2 K>=4: I, gliders
S=2 K>=5: I, gliders
S=2 K>=6: I, meshes

S=3 K>=4: I
S=3 K>=5: III, II -> I
S=3 K>=6: III

S=2,3 K>=4: IV->I, glider+puffer
S=2,3 K>=5: II, III -> III
S=2,3 K>=6: III

-- SPL=REFLECT (K=0,1)
S=2 K>=3: I, glider exist, no replication
S=2 K>=4: I
S=2 K>=5: I

S=3 K>=4: I
S=3 K>=5: I
S=3 K>=6: III

S=2,3 K>=4: III+IV -> I, gliders exist
S=2,3 K>=5: III (IV) -> I
S=2,3 K>=6: III (IV)


-- SPL=KEEP + REFLECT (incl. K=0)
S=1 K>=2: I, II
S=1 K>=3: I, (II)
S=1 K>=4: I, (II), linear growth that stops when colliding
S=1 K>=5: I, linear growth that stops when colliding
S=1 K>=6: I, linear growth that stops when colliding

S=2 K>=3: (II), III, lattice-like
S=2 K>=4: III
S=2 K>=5: III -> I
S=2 K>=6: I

S=1,2 K>=3: II, (III)
S=1,2 K>=4: III
S=1,2 K>=5: II, III, noise between lattice blobs
S=1,2 K>=6: I, almost stable polycrystal

-- SPL=KEEP + REFLECT-AVG
S=2 K>=3: I
S=2 K>=4: I
S=2 K>=5: I, mesh coarsing

S=2 K=0,K>=3: I
S=2 K=0,K>=4: I
S=2 K=0,K>=5: I, mesh coarsing

*/


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

    const num_particles = particles.length;
    const degree = new Array(num_particles);
    degree.fill(0);
    ctx.beginPath();
    for (var i = 0; i < num_particles; i++) {
        for (var j = 0; j < i; j++) {
            var p = particles[i];
            var q = particles[j];
            if (sqdist(p, q) <= 1) {
                degree[i]++;
                degree[j]++;

                ctx.moveTo(p.x, p.y);
                ctx.lineTo(q.x, q.y);
            }
        }
    }
    ctx.lineWidth = 0.03;
    ctx.strokeStyle = "gray";
    ctx.stroke();
    
    particles.forEach((p, ix) => {
        const deg = degree[ix];
        if (deg === deg_split || deg === deg_split2) {
            ctx.fillStyle = "blue";
        } else if (deg <= deg_kill_lower || deg >= deg_kill_upper) {
            ctx.fillStyle = "red";
        } else {
            ctx.fillStyle = "black";
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, 0.1, 0, 2 * Math.PI);
        ctx.fill();
    });
    ctx.restore();

    let rule_text = "";
    if (deg_kill_lower < 0) {
        rule_text += `d>=${deg_kill_upper}: die / `;
    } else {
        rule_text += `d<=${deg_kill_lower},>=${deg_kill_upper}: die / `;
    }
    
    if (deg_split2 === null) {
        rule_text += `d==${deg_split}: split`;
    } else {
        rule_text += `d==${deg_split},${deg_split2}: split`;
    }
    $("#label_rule").text(rule_text);
}

function init() {
    particles = [];
    for (let i = 0; i < 500; i++) {
        particles.push({x: Math.random() * 20 + 15, y: Math.random() * 20 + 15});
    }
}

function sqdist(p, q) {
    return (p.x - q.x) * (p.x - q.x) + (p.y - q.y) * (p.y - q.y);
}

function reflect(ref, p) {
    const dx = p.x - ref.x;
    const dy = p.y - ref.y;
    return {x: ref.x - dx, y: ref.y - dy};
}

function step() {
    const num_particles = particles.length;

    const degree = new Array(num_particles);
    degree.fill(0);

    for (let i = 0; i < num_particles; i++) {
        for (let j = 0; j < i; j++) {
            const p = particles[i];
            const q = particles[j];
            if (sqdist(p, q) <= 1) {
                degree[i]++;
                degree[j]++;
            }
        }
    }

    const new_particles = [];
    for (let i = 0; i < num_particles; i++) {
        const p = particles[i];
        const deg = degree[i];

        if (deg <= deg_kill_lower || deg >= deg_kill_upper) {
            // die
        } else if (deg === deg_split || deg === deg_split2) {
            // split
            const ns = [];
            for (let j = 0; j < num_particles; j++) {
                if (i == j) {
                    continue;
                }
                const q = particles[j];
                if (sqdist(p, q) <= 1) {
                    new_particles.push(reflect(p, q));
                }
            }
        } else {
            // keep
            new_particles.push(p);
        }        
    }
    particles = new_particles;
}

class Vec2 {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

class BoxSelection {
    constructor(p0, p1) {
        this.p0 = p0;
        this.p1 = p1;
    }
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
            dragStart: function(ev) {
                this.dragging = true;
                this.prevPos = new Vec2(ev.clientX, ev.clientY);
            },
            dragStop: function() {
                this.dragging = false;
                if (this.captureMode) {
                    // actually capture
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
                    this.selectionBox = new BoxSelection(this.prevPos, currPos);
                } else {
                    // normal: move canvas
                    const dx = ev.clientX - this.prevPos.x;
                    const dy = ev.clientY - this.prevPos.y;
                    this.viewportOrigin = new Vec2(this.viewportOrigin.x + dx, this.viewportOrigin.y + dy);
                    this.prevPos = currPos;
                }

                this.redraw();
            },
            redraw: function() {
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
                    this.numParticles = particles.length;
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
            clickReset: function() {
                init();
                this.numParticles = particles.length;
                this.tick = 0;
                this.redraw();
            },
            clickStep: function() {
                step();
                this.numParticles = particles.length;
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

    init();
    vm.startStepping();
}

main();
