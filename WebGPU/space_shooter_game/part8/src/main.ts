
import { QuadGeometry } from "./geometry";
import { Texture } from "./texture";
import { BufferUtil } from "./buffer-util";
import { Camera } from "./camera";
import { Content } from "./content";
import { Rect } from "./rect";
import { SpritePipeline } from "./sprite-pipeline";

class Renderer {

  private canvas!: HTMLCanvasElement;
  private context!: GPUCanvasContext;
  private device!: GPUDevice;

  private passEncoder!: GPURenderPassEncoder;

  private verticesBuffer!: GPUBuffer;
  private indexBuffer!: GPUBuffer;
  private projectionViewMatrixBuffer!: GPUBuffer;

  private vertexData: Float32Array = new Float32Array(7 * 4);
  private camera!: Camera;


  constructor() {

  }

  public async initialize(): Promise<void> {

    this.canvas = document.getElementById("canvas") as HTMLCanvasElement;

    this.camera = new Camera(this.canvas.width, this.canvas.height);

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


    this.projectionViewMatrixBuffer = BufferUtil.createUniformBuffer(this.device, new Float32Array(16));
    // this.verticesBuffer = BufferUtil.createVertexBuffer(this.device, this.vertexData);
    this.indexBuffer = BufferUtil.createIndexBuffer(this.device, new Uint16Array([
      0, 1, 2,
      2, 3, 0
    ]));
  }

  public draw(): void {

    this.camera.update();

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

    // DRAW HERE

    for (let i = 0; i < 100; i++) {
      this.drawSprite(Content.playerTexture, new Rect(
        Math.random() * this.canvas.width,
        Math.random() * this.canvas.height,
        100, 100));
    }
    for (let i = 0; i < 50; i++) {
      this.drawSprite(Content.ufoRedTexture, new Rect(
        Math.random() * this.canvas.width,
        Math.random() * this.canvas.height,
        100, 100));
    }

    // END DRAW HERE
    this.passEncoder.end();
    this.device.queue.submit([commandEncoder.finish()]);

    window.requestAnimationFrame(() => this.draw());
  }

  public drawSprite(texture: Texture, rect: Rect) {

    const spritePipeline = SpritePipeline.create(this.device, texture, this.projectionViewMatrixBuffer);

    // top left 
    this.vertexData[0] = rect.x;
    this.vertexData[1] = rect.y;
    this.vertexData[2] = 0.0;
    this.vertexData[3] = 0.0;
    this.vertexData[4] = 1.0;
    this.vertexData[5] = 1.0;
    this.vertexData[6] = 1.0;

    // top right
    this.vertexData[7] = rect.x + rect.width;
    this.vertexData[8] = rect.y;
    this.vertexData[9] = 1.0;
    this.vertexData[10] = 0.0;
    this.vertexData[11] = 1.0;
    this.vertexData[12] = 1.0;
    this.vertexData[13] = 1.0;

    // bottom right
    this.vertexData[14] = rect.x + rect.width;
    this.vertexData[15] = rect.y + rect.height;
    this.vertexData[16] = 1.0;
    this.vertexData[17] = 1.0;
    this.vertexData[18] = 1.0;
    this.vertexData[19] = 1.0;
    this.vertexData[20] = 1.0;

    // bottom left
    this.vertexData[21] = rect.x;
    this.vertexData[22] = rect.y + rect.height;
    this.vertexData[23] = 0.0;
    this.vertexData[24] = 1.0;
    this.vertexData[25] = 1.0;
    this.vertexData[26] = 1.0;
    this.vertexData[27] = 1.0;

    const vertexBuffer = BufferUtil.createVertexBuffer(this.device, this.vertexData);


    this.device.queue.writeBuffer(
      this.projectionViewMatrixBuffer,
      0,
      this.camera.projectionViewMatrix as Float32Array);

    // DRAW HERE
    this.passEncoder.setPipeline(spritePipeline.pipeline);
    this.passEncoder.setIndexBuffer(this.indexBuffer, "uint16");
    this.passEncoder.setVertexBuffer(0, vertexBuffer);
    this.passEncoder.setBindGroup(0, spritePipeline.projectionViewBindGroup);
    this.passEncoder.setBindGroup(1, spritePipeline.textureBindGroup);
    this.passEncoder.drawIndexed(6); // draw 3 vertices
  }

}

const renderer = new Renderer();
renderer.initialize().then(() => renderer.draw());