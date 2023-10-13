
import { Content } from "./content";
import { SpriteRenderer } from "./sprite-renderer";
import { InputManager } from "./input-manager";
import { vec2 } from "gl-matrix";
import { EffectsFactory } from "./effects-factory";
import { Texture } from "./texture";

export class Engine {

  private lastTime = 0;
  private canvas!: HTMLCanvasElement;
  private context!: GPUCanvasContext;
  private device!: GPUDevice;

  private passEncoder!: GPURenderPassEncoder;

  public spriteRenderer!: SpriteRenderer;
  public inputManager!: InputManager;
  public effectsFactory!: EffectsFactory;
  public gameBounds = vec2.create();

  public onUpdate: (dt: number) => void = () => { };
  public onDraw: () => void = () => { };

  // if this is null, we are rendering to the screen
  private destinationTexture?: GPUTexture | null = null;
  private destinationTexture2?: GPUTexture | null = null;


  public setDestinationTexture(texture?: GPUTexture, ): void {
    this.destinationTexture = texture;
  }

  public setDestinationTexture2(texture?: GPUTexture, ): void {
    this.destinationTexture2 = texture;
  }

  public getCanvasTexture() : GPUTexture
  {
    return this.context.getCurrentTexture();
  }

  public brightnessTexture2!: Texture;

  public async initialize(): Promise<void> {

    this.canvas = document.getElementById("canvas") as HTMLCanvasElement;
    this.context = this.canvas.getContext("webgpu") as GPUCanvasContext;

    this.gameBounds[0] = this.canvas.width;
    this.gameBounds[1] = this.canvas.height;

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

    this.inputManager = new InputManager();
    this.effectsFactory = new EffectsFactory(this.device, this.canvas.width, this.canvas.height);

    this.destinationTexture2 = (await Texture.createEmptyTexture(this.device, this.canvas.width, this.canvas.height, "bgra8unorm")).texture;
  }

  public draw(): void {

    const now = performance.now();
    const dt = now - this.lastTime;
    this.lastTime = now;

    this.onUpdate(dt);

    const commandEncoder = this.device.createCommandEncoder();

    const sceneTextureView = this.destinationTexture != null ? 
      this.destinationTexture.createView() :
      this.context.getCurrentTexture().createView();

    const renderPassDescriptor: GPURenderPassDescriptor = {
      colorAttachments: [
        {
          clearValue: { r: 0.8, g: 0.8, b: 0.8, a: 1.0 },
          loadOp: "clear",
          storeOp: "store",
          view: sceneTextureView
        },
        {
          clearValue: { r: 0.8, g: 0.8, b: 0.8, a: 1.0 },
          loadOp: "clear",
          storeOp: "store",
          view: this.destinationTexture2!.createView()
        }
      ]
    };

    this.passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);

    this.spriteRenderer.framePass(this.passEncoder);

    this.onDraw();

    this.spriteRenderer.frameEnd();

    // END DRAW HERE
    this.passEncoder.end();
    this.device.queue.submit([commandEncoder.finish()]);

    window.requestAnimationFrame(() => this.draw());
  }



}
