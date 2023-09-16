export class Texture {

    constructor(public texture: GPUTexture, public sampler: GPUSampler, public id: string,
        public width: number,
        public height: number
        ) { }

    /**
     * Create a placeholder texture for WebGPU texture and sampler
     * @param device 
     * @param image 
     * @returns 
     */
    public static async createTexture(device: GPUDevice, image: HTMLImageElement): Promise<Texture> {
        const texture = device.createTexture({
            size: { width: image.width, height: image.height },
            format: "rgba8unorm",
            usage: GPUTextureUsage.COPY_DST | GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.RENDER_ATTACHMENT
        });

        const data = await createImageBitmap(image);

        device.queue.copyExternalImageToTexture(
            { source: data },
            { texture: texture },
            { width: image.width, height: image.height }
        );

        const sampler = device.createSampler({
            magFilter: "nearest",
            minFilter: "nearest",
        });

        return new Texture(texture, sampler, image.src, image.width, image.height);
    }

    /**
     * Load a texture from a URL
     * @param device 
     * @param url 
     * @returns 
     */
    public static async createTextureFromURL(device: GPUDevice, url: string): Promise<Texture> {
        const promise = new Promise<HTMLImageElement>((resolve, reject) => {
            const image = new Image();
            image.src = url;
            image.onload = () => resolve(image);
            image.onerror = () => {
                console.error(`Failed to load image ${url}`);
                reject();
            }
        });

        const image = await promise;
        return Texture.createTexture(device, image);
    }
}