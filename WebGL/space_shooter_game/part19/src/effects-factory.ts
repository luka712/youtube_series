import { BloomEffect } from "./bloom-effect";
import { BlurEffect } from "./blur-effect";
import { GrayScaleEffect } from "./grayscale-effect";
import { TextureEffect } from "./texture-effect";

export class EffectsFactory {
    constructor(private gl: WebGL2RenderingContext,
        private width: number,
        private height: number) {

    }

    public createGrayScaleEffect(): GrayScaleEffect {
        return new GrayScaleEffect(this.gl, this.width, this.height);
    }

    public createTextureEffect(): TextureEffect {
        return new TextureEffect(this.gl, this.width, this.height);
    }

    public createBlurEffect(): BlurEffect {
        return new BlurEffect(this.gl, this.width, this.height);
    }

    public createBloomEffect(): BloomEffect {
        return new BloomEffect(this.gl, this.width, this.height);
    }
}