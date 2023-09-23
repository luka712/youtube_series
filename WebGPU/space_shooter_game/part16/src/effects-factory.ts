import { PostProcessEffect } from "./post-process-effect";

export class EffectsFactory 
{
    constructor(private device: GPUDevice,
        private width: number,
        private height: number)
    {

    }

    public async createPostProcessEffect(): Promise<PostProcessEffect>
    {
        const effect = new PostProcessEffect(this.device, this.width, this.height);
        await effect.initialize();
        return effect;
    }
}