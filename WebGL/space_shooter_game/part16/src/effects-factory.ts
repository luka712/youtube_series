import { GrayScaleEffect } from "./grayscale-effect";

export class EffectsFactory {
    constructor(private gl: WebGL2RenderingContext, private width: number, private height: number) {

    }

    public createGrayScaleEffect(): GrayScaleEffect {
        return new GrayScaleEffect(this.gl, this.width, this.height);
    }
}