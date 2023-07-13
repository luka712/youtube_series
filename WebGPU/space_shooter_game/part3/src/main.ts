
import shaderSource from "./shaders/shader.wgsl?raw";

class Renderer {

  private context!: GPUCanvasContext;
  private device!: GPUDevice;
  private pipeline!: GPURenderPipeline;
  private positionBuffer!: GPUBuffer;
  private colorsBuffer!: GPUBuffer;

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

    this.positionBuffer = this.createBuffer(new Float32Array([
      -0.5, -0.5, // x, y
      0.5, -0.5,
    -0.5, 0.5,
    -0.5, 0.5,
    0.5, 0.5,
      0.5, -0.5
    ]));

    this.colorsBuffer = this.createBuffer(new Float32Array([
      1.0, 0.0, 1.0,  // r g b 
      0.0, 1.0, 1.0,
      0.0, 1.0, 1.0,
      1.0, 0.0, 0.0,  // r g b 
      0.0, 1.0, 0.0,
      0.0, 0.0, 1.0,
    ]));
  }

  private createBuffer(data: Float32Array): GPUBuffer {

    const buffer = this.device.createBuffer({
      size: data.byteLength,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
      mappedAtCreation: true
    });

    new Float32Array(buffer.getMappedRange()).set(data);
    buffer.unmap();

    return buffer;
  }

  private prepareModel(): void {

    const shaderModule = this.device.createShaderModule({
      code: shaderSource
    });

    const positionBufferLayout: GPUVertexBufferLayout =
    {
      arrayStride: 2 * Float32Array.BYTES_PER_ELEMENT, // 2 floats * 4 bytes per float
      attributes: [
        {
          shaderLocation: 0,
          offset: 0,
          format: "float32x2" // 2 floats
        }
      ],
      stepMode: "vertex"
    };

    const colorBufferLayout: GPUVertexBufferLayout = {
      arrayStride: 3 * Float32Array.BYTES_PER_ELEMENT, // rgb * 4 bytes per float
      attributes: [
        {
          shaderLocation: 1,
          offset: 0,
          format: "float32x3" // 3 floats
        }
      ],
      stepMode: "vertex"
    };


    const vertexState: GPUVertexState = {
      module: shaderModule,
      entryPoint: "vertexMain", // name of the entry point function for vertex shader, must be same as in shader
      buffers: [
        positionBufferLayout,
        colorBufferLayout
      ]
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
    passEncoder.setVertexBuffer(0, this.positionBuffer);
    passEncoder.setVertexBuffer(1, this.colorsBuffer);
    passEncoder.draw(6); // draw 3 vertices
    passEncoder.end();
    this.device.queue.submit([commandEncoder.finish()]);
  }

}

const renderer = new Renderer();
renderer.initialize().then(() => renderer.draw());