"use strict";

export class Vec2 {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    add(v) {
        this.x += v.x;
        this.y += v.y;
        return this;
    }

    sub(v) {
        this.x -= v.x;
        this.y -= v.y;
        return this;
    }

    mult(k) {
        this.x *= k;
        this.y *= k;
        return this;
    }

    rotate(cos, sin) {
        const nx = cos * this.x + sin * this.y;
        const ny = -sin * this.x + cos * this.y;
        this.x = nx;
        this.y = ny;
        return this;
    }

    clone() {
        return new Vec2(this.x, this.y);
    }
}

export class AABB {
    constructor(p0, p1) {
        this.p0 = new Vec2(Math.min(p0.x, p1.x), Math.min(p0.y, p1.y));
        this.p1 = new Vec2(Math.max(p0.x, p1.x), Math.max(p0.y, p1.y));
    }

    contains(p) {
        return this.p0.x <= p.x && p.x <= this.p1.x && this.p0.y <= p.y && p.y <= this.p1.y;
    }
}
