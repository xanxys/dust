"use strict";

let interval = null;
let particles = [];
let tick = 0;

const deg_split = 2;
const deg_split2 = 3;

const deg_kill_lower = 1;
const deg_kill_upper = 6;

/*
I: stable
II: repetitive
III: chaotic
IV: edge of chaos

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

-- SPL=REFLECT (K<=1)
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


function redraw() {
    let canvas = document.getElementById("main");
    const ctx = canvas.getContext("2d");

    ctx.save();
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.scale(10, 10);

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


    $("#label_tick").text("tick=" + tick);
    $("#label_num").text("#particles=" + particles.length);

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
    for (let i = 0; i < 200; i++) {
        particles.push({x: Math.random() * 15 + 15, y: Math.random() * 15 + 15});
    }
    tick = 0;
}

function sqdist(p, q) {
    return (p.x - q.x) * (p.x - q.x) + (p.y - q.y) * (p.y - q.y);
}

function avg(ps) {
    let sx = 0;
    let sy = 0;
    for (let i = 0; i < ps.length; i++) {
        sx += ps[i].x;
        sy += ps[i].y;
    }
    let k = 1.0 / ps.length;
    return {x: k * sx, y: k * sy};
}

function reflect(ref, p) {
    const dx = p.x - ref.x;
    const dy = p.y - ref.y;
    return {x: ref.x - dx, y: ref.y - dy};
}

function step() {
    const num_particles = particles.length;

    // Torus boundary condition.
    const size = 80;
    for (let i = 0; i < num_particles; i++) {
        const p = particles[i];
        if (p.x < 0) {
            p.x += size;
        } else if (p.x > size) {
            p.x -= size;
        }

        if (p.y < 0) {
            p.y += size;
        } else if (p.y > size) {
            p.y -= size;
        }
    }


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

    tick++;
}

function main() {
    $("#btn_reset").click(() => {
        init();
        redraw();
    });
    $("#btn_step").click(() => {
        step();
        redraw();
    });
    $('#btn_start').click(() => {
        if (interval !== null) {
            return;
        }
        interval = setInterval(() => {
            step();
            redraw();
        }, 100);
    });
    $('#btn_stop').click(() => {
        if (interval === null) {
            return;
        }
        clearInterval(interval);
        interval = null;
    });

    init();
    interval = setInterval(() => {
        step();
        redraw();
    }, 100);
    redraw();
}

main();
