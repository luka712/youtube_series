import { BufferUtil } from "./buffer-util";
import { Texture } from "./texture";
import shaderSource from "./shaders/bloom-effect.wgsl?raw"
import { BloomBlurEffect } from "./bloom-blur-effect";

export class BloomEffect {
    private gpuPipeline!: GPURenderPipeline;
    private gpuBuffer!: GPUBuffer; // vertex buffer

    // screen texture
    public sceneTexture!: Texture;
    private sceneTextureBindGroup!: GPUBindGroup;

    // combine texture
    public brightnessTexture!: Texture;
    private brightnessTextureBindGroup!: GPUBindGroup;

    private blurEffect!: BloomBlurEffect;

    constructor(private device: GPUDevice,
        public width: number,
        public height: number) {

    }


    public async initialize() {
        this.sceneTexture = await Texture.createEmptyTexture(this.device, this.width, 
            this.height, "bgra8unorm");
        this.brightnessTexture = await Texture.createEmptyTexture(this.device, this.width, 
            this.height, "bgra8unorm");

        this.gpuBuffer = BufferUtil.createVertexBuffer(this.device, new Float32Array([
            // pos(x,y) tex(u,v)

            // first triangle
            // top left 
            -1.0, 1.0, 0.0, 0.0,
            // top right
            1.0, 1.0, 1.0, 0.0,
            // bottom left 
            -1.0, -1.0, 0.0, 1.0,

            // second triangle
            // bottom left
            -1.0, -1.0, 0.0, 1.0,
            // top right
            1.0, 1.0, 1.0, 0.0,
            // bottom right
            1.0, -1.0, 1.0, 1.0
        ]));


        const textureBindGroupLayout = this.device.createBindGroupLayout({
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.FRAGMENT,
                    sampler: {}
                },
                {
                    binding: 1,
                    visibility: GPUShaderStage.FRAGMENT,
                    texture: {}
                }
            ]
        });


        this.sceneTextureBindGroup = this.device.createBindGroup({
            layout: textureBindGroupLayout,
            entries: [
                {
                    binding: 0,
                    resource: this.sceneTexture.sampler
                },
                {
                    binding: 1,
                    resource: this.sceneTexture.texture.createView()
                }
            ]
        });

        this.brightnessTextureBindGroup = this.device.createBindGroup({
            layout: textureBindGroupLayout,
            entries: [
                {
                    binding: 0,
                    resource: this.brightnessTexture.sampler
                },
                {
                    binding: 1,
                    resource: this.brightnessTexture.texture.createView()
                }
            ]
        });


        const shaderModule = this.device.createShaderModule({
            code: shaderSource
        });

        const desc: GPURenderPipelineDescriptor = {
            layout: this.device.createPipelineLayout({
                bindGroupLayouts: [
                    textureBindGroupLayout, // group(0)
                    textureBindGroupLayout, // group(1)
                ]
            }),
            vertex: {
                module: shaderModule,
                entryPoint: "vertexMain",
                buffers: [
                    {
                        arrayStride: 4 * Float32Array.BYTES_PER_ELEMENT,
                        attributes: [
                            {
                                shaderLocation: 0,
                                offset: 0,
                                format: "float32x2"
                            },
                            {
                                shaderLocation: 1,
                                offset: 2 * Float32Array.BYTES_PER_ELEMENT,
                                format: "float32x2"
                            }
                        ]
                    }
                ]
            },
            fragment: {
                module: shaderModule,
                entryPoint: "fragmentMain",
                targets: [
                    {
                        format: "bgra8unorm"
                    }
                ]
            },
            primitive: {
                topology: "triangle-list"
            }
        };

        this.gpuPipeline = this.device.createRenderPipeline(desc);

        this.blurEffect = new BloomBlurEffect(this.device, this.width, this.height);
        await this.blurEffect.initialize();
    }

    public draw(destinationTextureView: GPUTextureView) {

        this.blurEffect.draw(this.brightnessTexture.texture.createView(), this.brightnessTextureBindGroup);
        this.blurEffect.draw(this.brightnessTexture.texture.createView(), this.brightnessTextureBindGroup);
        this.blurEffect.draw(this.brightnessTexture.texture.createView(), this.brightnessTextureBindGroup);
        this.blurEffect.draw(this.brightnessTexture.texture.createView(), this.brightnessTextureBindGroup);
        this.blurEffect.draw(this.brightnessTexture.texture.createView(), this.brightnessTextureBindGroup);
        this.blurEffect.draw(this.brightnessTexture.texture.createView(), this.brightnessTextureBindGroup);
        this.blurEffect.draw(this.brightnessTexture.texture.createView(), this.brightnessTextureBindGroup);
        this.blurEffect.draw(this.brightnessTexture.texture.createView(), this.brightnessTextureBindGroup);
        this.blurEffect.draw(this.brightnessTexture.texture.createView(), this.brightnessTextureBindGroup);
        this.blurEffect.draw(this.brightnessTexture.texture.createView(), this.brightnessTextureBindGroup);


        const commandEncoder = this.device.createCommandEncoder();
        const passEncoder = commandEncoder.beginRenderPass({
            colorAttachments: [
                {
                    view: destinationTextureView,
                    loadOp: "clear",
                    storeOp: "store",
                }
            ]
        });

        passEncoder.setPipeline(this.gpuPipeline);
        passEncoder.setVertexBuffer(0, this.gpuBuffer);
        passEncoder.setBindGroup(0, this.sceneTextureBindGroup);
        passEncoder.setBindGroup(1, this.brightnessTextureBindGroup);
        passEncoder.draw(6, 1, 0, 0);

        passEncoder.end();
        this.device.queue.submit([commandEncoder.finish()]);
    }
}