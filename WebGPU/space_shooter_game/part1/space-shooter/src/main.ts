
class Renderer {

  private context!: GPUCanvasContext;
  private device!: GPUDevice;

  constructor() {

  }

  public async initialize(): Promise<void> {

    const canvas = document.getElementById("canvas") as HTMLCanvasElement;

    /**
     * The GPUCanvasContext interface of the WebGPU API provides a drawing 
     * context for a <canvas> element.
     * It is used to draw content onto the canvas.
     */
    this.context = canvas.getContext("webgpu") as GPUCanvasContext;

    if (!this.context) {
      console.error("WebGPU not supported");
      alert("WebGPU not supported");
      return;
    }

    /**
     * The GPUAdapter interface of the WebGPU API provides access to available GPUs on the system.
     * It is the starting point for all WebGPU applications.
     */
    const adapter = await navigator.gpu.requestAdapter();

    if (!adapter) {
      console.error("No adapter found");
      alert("No adapter found");
      return;
    }

    /**
     * The GPUDevice interface of the WebGPU API represents a connected physical device.
     * It is used to create all other WebGPU objects.
     * It is created from a GPUAdapter.
     * It is the starting point for all WebGPU applications.
     */
    this.device = await adapter.requestDevice();

    /**
     * The GPUDevice.configure method of the WebGPU API configures the device for a given canvas.
     * It is used to set the device's preferred format and size for the canvas.
     * It is called once per canvas.
     * It is called before any other WebGPU methods.
     */
    this.context.configure({
      device: this.device,
      format: navigator.gpu.getPreferredCanvasFormat() // RGBA8Unorm is the only guaranteed renderable format
    });
  }

  public draw(): void {
    /**
     * The GPUCommandEncoder interface of the WebGPU API is
     * a base interface for all command encoders.
     * It is used to create command buffers.
     */
    const commandEncoder = this.device.createCommandEncoder();

    /**
     * The GPURenderPassDescriptor interface of the WebGPU API 
     * is used to describe a render pass.
     * It is used to create a render pass encoder.
     */
    const renderPassDescriptor: GPURenderPassDescriptor = {
      /**
       * The colorAttachments property of the GPURenderPassDescriptor 
       * interface of the WebGPU API is an array of color attachments.
       * It is used to describe the color attachments of a render pass.
       * It is used to create a render pass encoder.
       */
      colorAttachments: [
        {
          // clearColor is used to describe the color that the 
          // texture will be cleared to.
          clearValue: { r: 0.8, g: 0.8, b: 0.8, a: 1.0 },
          // loadOp is used to describe how the texture will be
          // loaded. In this case, we are clearing the texture.
          loadOp: "clear", 
          // storeOp is used to describe how the texture will be stored.
          // In this case, we are storing the texture.
          storeOp: "store",
          // view is used to describe the texture that will be rendered to.
          view: this.context.getCurrentTexture().createView()
        }
      ]
    };

    // beginRenderPass is used to create a render pass encoder. 
    // It is called once per render pass.
    // passEncoder is used to encode commands for a render pass.
    const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);

    // DRAW HERE

    // endPass is used to end a render pass encoder.
    passEncoder.end();
    
    // submit is used to submit a command buffer to the GPU.
    // commandEncoder.finish() is used to create a command buffer.
    this.device.queue.submit([commandEncoder.finish()]);
  }

}

const renderer = new Renderer();
renderer.initialize().then(() => renderer.draw());