
import shaderSource from "./shaders/shader.wgsl?raw";

class Renderer {

  private context!: GPUCanvasContext;
  private device!: GPUDevice;
  private pipeline!: GPURenderPipeline;

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

    this.prepareModel();

  }

  private prepareModel(): void {

    const shaderModule = this.device.createShaderModule({
      code: shaderSource
    });


    const vertexState: GPUVertexState = {
      module: shaderModule,
      entryPoint: "vertexMain", // name of the entry point function for vertex shader, must be same as in shader
      buffers: []
    };

    const fragmentState: GPUFragmentState = {
      module: shaderModule,
      entryPoint: "fragmentMain", // name of the entry point function for fragment/pixel shader, must be same as in shader
      targets: [
        {
          format: navigator.gpu.getPreferredCanvasFormat() 
        }
      ]
    };

    this.pipeline = this.device.createRenderPipeline({
      vertex: vertexState,
      fragment: fragmentState,
      primitive: {
        topology: "triangle-list" // type of primitive to render
      },
      layout: "auto",
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
    passEncoder.draw(3); // draw 3 vertices

    passEncoder.end();
    this.device.queue.submit([commandEncoder.finish()]);
  }

}

const renderer = new Renderer();
renderer.initialize().then(() => renderer.draw());