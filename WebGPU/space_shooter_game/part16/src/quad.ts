import { vec2 } from "gl-matrix";

export class Quad {
    constructor(
        public topLeft: vec2,
        public topRight: vec2,
        public bottomRight: vec2,
        public bottomLeft: vec2
    ) { }
}