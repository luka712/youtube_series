
import { vec2 } from "gl-matrix";
import { Color } from "./color";
import { Content } from "./content";
import { Rect } from "./rect";
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

  rotation = 0;

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

    /*
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
    */
    this.rotation += 0.01;

    const playerSprite = Content.sprites["playerShip1_blue.png"];
    playerSprite.drawRect.x += 0.7;
    playerSprite.drawRect.y += 0.7;

    this.spriteRenderer.drawSpriteSource(playerSprite.texture,
      playerSprite.drawRect, playerSprite.sourceRect, undefined, this.rotation, vec2.fromValues(0.5, 0.5));

    const shield = Content.sprites["shield1.png"];
    shield.drawRect.x = playerSprite.drawRect.x - 13;
    shield.drawRect.y = playerSprite.drawRect.y - 12;

    this.spriteRenderer.drawSpriteSource(shield.texture,
      shield.drawRect, shield.sourceRect, new Color(0,0,1), this.rotation, vec2.fromValues(0.5, 0.5));

    const drawRect = new Rect(100, 100, 200, 200);

    const halfWidth = Content.uvTexture.width / 2;
    const halfHeight = Content.uvTexture.height / 2;
    const sourceRect = new Rect(0, halfHeight, halfWidth, halfHeight);

    this.spriteRenderer.drawSpriteSource(Content.uvTexture, drawRect, sourceRect, undefined, 
      this.rotation, vec2.fromValues(0.5, 0.5));

    this.spriteRenderer.frameEnd();

    // END DRAW HERE
    this.passEncoder.end();
    this.device.queue.submit([commandEncoder.finish()]);

    window.requestAnimationFrame(() => this.draw());
  }



}

const renderer = new Renderer();
renderer.initialize().then(() => renderer.draw());