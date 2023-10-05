import { BufferUtil } from "./buffer-util";
import { Texture } from "./texture";
import shaderSource from "./shaders/blur-effect.wgsl?raw"

export class BlurEffect {

    private gpuHorizontalPassPipeline!: GPURenderPipeline;
    private gpuVerticalPassPipeline!: GPURenderPipeline;

    private gpuBuffer!: GPUBuffer;

    // we render to this texture.
    private horizontalPassRenderTexture!: Texture;
    private horizontalPassTextureBindGroup!: GPUBindGroup;

    private verticalPassRenderTexture!: Texture;
    private verticalPassTextureBindGroup!: GPUBindGroup;

    public doVerticalPass = true;
    public doHorizontalPass = true;

    public getRenderTexture(): Texture|null {

        // must be texture of first pass
        if(this.doHorizontalPass){
            return this.horizontalPassRenderTexture;
        }
        if(this.doVerticalPass) {
            return this.verticalPassRenderTexture;
        }
        return null;
    }

    constructor(private device: GPUDevice,
        public width: number,
        public height: number) {

    }

    private createPipeline(sourceCode: string, textureBindGroupLayout: GPUBindGroupLayout, horizontal: boolean): GPURenderPipeline {
        const shaderModule = this.device.createShaderModule({
            code: sourceCode
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

    public async initialize() {
        this.horizontalPassRenderTexture = await Texture.createEmptyTexture(this.device, this.width, this.height, "bgra8unorm", "horizontal");
        this.verticalPassRenderTexture = await Texture.createEmptyTexture(this.device, this.width, this.height, "bgra8unorm", "vertical");

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

        this.horizontalPassTextureBindGroup = this.device.createBindGroup({
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

        this.verticalPassTextureBindGroup = this.device.createBindGroup({
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


        this.gpuHorizontalPassPipeline = this.createPipeline(shaderSource, textureBindGroupLayout, true);
        this.gpuVerticalPassPipeline = this.createPipeline(shaderSource, textureBindGroupLayout, false);
    }

    public draw(destinationTextureView: GPUTextureView) {


        if (!this.doHorizontalPass && !this.doVerticalPass) return;

        if (this.doHorizontalPass) {

            // if there is also another pass after this one, we render to the render texture.
            const textureView = this.doVerticalPass ? this.verticalPassRenderTexture.texture.createView() : destinationTextureView;

            const commandEncoder = this.device.createCommandEncoder();
            const passEncoder = commandEncoder.beginRenderPass({
                colorAttachments: [
                    {
                        view: textureView,
                        loadOp: "clear",
                        storeOp: "store",
                    }
                ]
            });

            passEncoder.setPipeline(this.gpuHorizontalPassPipeline);
            passEncoder.setVertexBuffer(0, this.gpuBuffer);
            passEncoder.setBindGroup(0, this.horizontalPassTextureBindGroup);
            passEncoder.draw(6, 1, 0, 0);

            passEncoder.end();
            this.device.queue.submit([commandEncoder.finish()]);
        }

        if (this.doVerticalPass) {

            const commandEncoder = this.device.createCommandEncoder();
            const passEncoder = commandEncoder.beginRenderPass({
                colorAttachments: [
                    {
                        view: destinationTextureView,
                        loadOp: "clear",
                        storeOp: "store"
                    }
                ]
            });

            passEncoder.setPipeline(this.gpuVerticalPassPipeline);
            passEncoder.setVertexBuffer(0, this.gpuBuffer);
            passEncoder.setBindGroup(0, this.verticalPassTextureBindGroup);
            passEncoder.draw(6, 1, 0, 0);

            passEncoder.end();
            this.device.queue.submit([commandEncoder.finish()]);
        }


    }
}