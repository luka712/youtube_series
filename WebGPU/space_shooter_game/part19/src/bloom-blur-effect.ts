import { BufferUtil } from "./buffer-util";
import { Texture } from "./texture";
import shaderSource from "./shaders/blur-effect.wgsl?raw"

export class BlurEffect {

    private horizontalPassPipeline!: GPURenderPipeline;
    private horizontalPassRenderTexture!: Texture;
    private horizontalPassBindGroup!: GPUBindGroup;

    private verticalPassPipeline!: GPURenderPipeline;
    private verticalPassRenderTexture!: Texture;
    private verticalPassBindGroup!: GPUBindGroup;

    public doHorizontalPass = true;
    public doVerticalPass = true;

    private createPipeline(shaderSource: string,
        textureBindGroupLayout: GPUBindGroupLayout,
        horizontal: boolean
    ): GPURenderPipeline {
        const shaderModule = this.device.createShaderModule({
            code: shaderSource
        });


        const desc: GPURenderPipelineDescriptor = {
            layout: this.device.createPipelineLayout({
                bindGroupLayouts: [textureBindGroupLayout]
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
                entryPoint: horizontal ? "fragmentMainHorizontal" : "fragmentMainVertical",
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

        return this.device.createRenderPipeline(desc);
    }

    private gpuBuffer!: GPUBuffer;



    public getRenderTexture(): Texture | null {
        return this.horizontalPassRenderTexture;
    }

    constructor(private device: GPUDevice,
        public width: number,
        public height: number) {

    }

    public async initialize() {
        this.horizontalPassRenderTexture = await Texture.createEmptyTexture(this.device, this.width, this.height, "bgra8unorm");
        this.verticalPassRenderTexture = await Texture.createEmptyTexture(this.device, this.width, this.height, "bgra8unorm");

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

        this.horizontalPassBindGroup = this.device.createBindGroup({
            layout: textureBindGroupLayout,
            entries: [
                {
                    binding: 0,
                    resource: this.horizontalPassRenderTexture.sampler
                },
                {
                    binding: 1,
                    resource: this.horizontalPassRenderTexture.texture.createView()
                }
            ]
        });

        this.verticalPassBindGroup = this.device.createBindGroup({
            layout: textureBindGroupLayout,
            entries: [
                {
                    binding: 0,
                    resource: this.verticalPassRenderTexture.sampler
                },
                {
                    binding: 1,
                    resource: this.verticalPassRenderTexture.texture.createView()
                }
            ]
        });


        this.horizontalPassPipeline = this.createPipeline(shaderSource, textureBindGroupLayout, true);
        this.verticalPassPipeline = this.createPipeline(shaderSource, textureBindGroupLayout, false);
    }

    public draw(textureToApplyEffectTo: GPUTextureView) {

        // HORIZONTAL PASS 
        const horizontalCommandEncoder = this.device.createCommandEncoder();
        const horizontalPassEncoder = horizontalCommandEncoder.beginRenderPass({
            colorAttachments: [
                {
                    view: this.verticalPassRenderTexture.texture.createView(),
                    loadOp: "clear",
                    storeOp: "store",
                }
            ]
        });

        horizontalPassEncoder.setPipeline(this.horizontalPassPipeline);
        horizontalPassEncoder.setVertexBuffer(0, this.gpuBuffer);
        // We actually don't even need this, but keep it here for completeness.
        horizontalPassEncoder.setBindGroup(0, this.horizontalPassBindGroup);
        horizontalPassEncoder.draw(6, 1, 0, 0);

        horizontalPassEncoder.end();
        this.device.queue.submit([horizontalCommandEncoder.finish()]);


        // VERTICAL PASS
        const verticalCommandEncoder = this.device.createCommandEncoder();
        const verticalPassEncoder = verticalCommandEncoder.beginRenderPass({
            colorAttachments: [
                {
                    view: textureToApplyEffectTo,
                    loadOp: "clear",
                    storeOp: "store",
                }
            ]
        });

        verticalPassEncoder.setPipeline(this.verticalPassPipeline);
        verticalPassEncoder.setVertexBuffer(0, this.gpuBuffer);
        verticalPassEncoder.setBindGroup(0, this.verticalPassBindGroup);
        verticalPassEncoder.draw(6, 1, 0, 0);

        verticalPassEncoder.end();
        this.device.queue.submit([verticalCommandEncoder.finish()]);

    }
}