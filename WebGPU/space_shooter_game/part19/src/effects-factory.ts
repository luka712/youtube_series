import { BlurEffect } from "./blur-effect";
import { PostProcessEffect } from "./post-process-effect";
import { TextureEffect } from "./texture-effect";

export class EffectsFactory {
    constructor(private device: GPUDevice,
        private width: number,
        private height: number) {

    }

    public async createPostProcessEffect(): Promise<PostProcessEffect> {
        const effect = new PostProcessEffect(this.device, this.width, this.height);
        await effect.initialize();
        return effect;
    }

    public async createTextureEffect(): Promise<TextureEffect> {
        const effect = new TextureEffect(this.device, this.width, this.height);
        await effect.initialize();
        return effect;
    }

    public async createBlurEffect(): Promise<BlurEffect> {
        const effect = new BlurEffect(this.device, this.width, this.height);
        await effect.initialize();
        return effect;
    }
}