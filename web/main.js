"use strict";

let interval = null;
let particles = [];
let tick = 0;

function redraw() {
    let canvas = document.getElementById("main");
    const ctx = canvas.getContext("2d");

    ctx.save();
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.scale(25, 25);



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
        if (degree[ix] == 2) {
            ctx.fillStyle = "blue";
        } else if (degree[ix] >= 4) {
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
}

function init() {
    particles = [];
    for (let i = 0; i < 100; i++) {
        particles.push({x: Math.random() * 10, y: Math.random() * 10});
    }
    tick = 0;
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

        if (deg == 0 || deg >= 4) {
            // die
        } else if (deg == 2) {
            // split
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

    redraw();
}

main();
