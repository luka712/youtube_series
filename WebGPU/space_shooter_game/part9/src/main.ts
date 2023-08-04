
import { QuadGeometry } from "./geometry";
import { Texture } from "./texture";
import { BufferUtil } from "./buffer-util";
import { Camera } from "./camera";
import { Content } from "./content";
import { Rect } from "./rect";
import { SpritePipeline } from "./sprite-pipeline";
import { SpriteRenderer } from "./sprite-renderer";

class Renderer {

  private canvas!: HTMLCanvasElement;
  private context!: GPUCanvasContext;
  private device!: GPUDevice;

  private passEncoder!: GPURenderPassEncoder;

  private spriteRenderer!: SpriteRenderer;

  constructor() {

  }

  public async initialize(): Promise<void> {

    this.canvas = document.getElementById("canvas") as HTMLCanvasElement;
    this.context = this.canvas.getContext("webgpu") as GPUCanvasContext;

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

    await Content.initialize(this.device);

    this.context.configure({
      device: this.device,
      format: navigator.gpu.getPreferredCanvasFormat()
    });

    this.spriteRenderer = new SpriteRenderer(this.device, this.canvas.width, this.canvas.height);
    this.spriteRenderer.initialize();
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

    this.passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);

    this.spriteRenderer.framePass(this.passEncoder);

    // DRAW HERE

    for (let i = 0; i < 20000; i++) {
      this.spriteRenderer.drawSprite(Content.playerTexture, new Rect(
        Math.random() * this.canvas.width,
        Math.random() * this.canvas.height,
        10, 10));
    }
    for (let i = 0; i < 20000; i++) {
      this.spriteRenderer.drawSprite(Content.ufoRedTexture, new Rect(
        Math.random() * this.canvas.width,
        Math.random() * this.canvas.height,
        10, 10));
    }

    this.spriteRenderer.frameEnd();

    // END DRAW HERE
    this.passEncoder.end();
    this.device.queue.submit([commandEncoder.finish()]);

    window.requestAnimationFrame(() => this.draw());
  }

  

}

const renderer = new Renderer();
renderer.initialize().then(() => renderer.draw());