
import shaderSource from "./shaders/shader.wgsl?raw";
import { QuadGeometry } from "./geometry";
import { Texture } from "./texture";
import { BufferUtil  } from "./buffer-util";

class Renderer {

  private context!: GPUCanvasContext;
  private device!: GPUDevice;
  private pipeline!: GPURenderPipeline;
  private verticesBuffer!: GPUBuffer;
  private indexBuffer!: GPUBuffer;
  private textureBindGroup!: GPUBindGroup;

  private testTexture!: Texture;

  constructor() {

  }

  public async initialize(): Promise<void> {

    const canvas = document.getElementById("canvas") as HTMLCanvasElement;
    this.context = canvas.getContext("webgpu") as GPUCanvasContext;

    if (!this.context) {
      console.error("WebGPU not supported");
      alert("WebGPU not supported");
      return;
    }

    const adapter = await navigator.gpu.requestAdapter();

    if (!adapter) {
      console.error("No adapter found");
      alert("No adapter found");
      return;
    }

    this.device = await adapter.requestDevice();

    this.context.configure({
      device: this.device,
      format: navigator.gpu.getPreferredCanvasFormat()
    });

    this.testTexture = await Texture.createTextureFromURL(this.device, "assets/uv_test.png");
    this.prepareModel();

    const geometry = new QuadGeometry();

    this.verticesBuffer = BufferUtil.createVertexBuffer(this.device, new Float32Array(geometry.vertices));
    this.indexBuffer = BufferUtil.createIndexBuffer(this.device, new Uint16Array(geometry.inidices));
  }


  private prepareModel(): void {

    const shaderModule = this.device.createShaderModule({
      code: shaderSource
    });

    const positionBufferLayout: GPUVertexBufferLayout =
    {
      arrayStride: 7 * Float32Array.BYTES_PER_ELEMENT, // 2 floats * 4 bytes per float
      attributes: [
        {
          shaderLocation: 0,
          offset: 0,
          format: "float32x2" // 2 floats
        },
        {
          shaderLocation: 1,
          offset: 2 * Float32Array.BYTES_PER_ELEMENT,
          format: "float32x2" // 2 floats
        },
        {
          shaderLocation: 2,
          offset: 4 * Float32Array.BYTES_PER_ELEMENT,
          format: "float32x3" // 3 floats
        }
      ],
      stepMode: "vertex"
    };


    const vertexState: GPUVertexState = {
      module: shaderModule,
      entryPoint: "vertexMain", // name of the entry point function for vertex shader, must be same as in shader
      buffers: [
        positionBufferLayout,      ]
    };

    const fragmentState: GPUFragmentState = {
      module: shaderModule,
      entryPoint: "fragmentMain", // name of the entry point function for fragment/pixel shader, must be same as in shader
      targets: [
        {
          format: navigator.gpu.getPreferredCanvasFormat(),
          blend: {
            color: {
              srcFactor: "one",
              dstFactor: "one-minus-src-alpha",
              operation: "add"
            },
            alpha: {
              srcFactor: "one",
              dstFactor: "one-minus-src-alpha",
              operation: "add"
            }
          }
        }
      ]
    };

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

    const pipelineLayout = this.device.createPipelineLayout({
      bindGroupLayouts: [
        textureBindGroupLayout
      ]
    });

    this.textureBindGroup = this.device.createBindGroup({
      layout: textureBindGroupLayout,
      entries: [
        {
          binding: 0,
          resource: this.testTexture.sampler
        },
        {
          binding: 1,
          resource: this.testTexture.texture.createView()
        }
      ]
    });


    this.pipeline = this.device.createRenderPipeline({
      vertex: vertexState,
      fragment: fragmentState,
      primitive: {
        topology: "triangle-list" // type of primitive to render
      },
      layout: pipelineLayout,
    });

  }

  public draw(): void {

    const commandEncoder = this.device.createCommandEncoder();

    const renderPassDescriptor: GPURenderPassDescriptor = {
      colorAttachments: [
        {
          clearValue: { r: 0.8, g: 0.8, b: 0.8, a: 1.0 },
          loadOp: "clear",
          storeOp: "store",
          view: this.context.getCurrentTexture().createView()
        }
      ]
    };

    const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);

    // DRAW HERE
    passEncoder.setPipeline(this.pipeline);
    passEncoder.setIndexBuffer(this.indexBuffer, "uint16");
    passEncoder.setVertexBuffer(0, this.verticesBuffer);
    passEncoder.setBindGroup(0, this.textureBindGroup);
    passEncoder.drawIndexed(6); // draw 3 vertices
    passEncoder.end();
    this.device.queue.submit([commandEncoder.finish()]);
  }

}

const renderer = new Renderer();
renderer.initialize().then(() => renderer.draw());