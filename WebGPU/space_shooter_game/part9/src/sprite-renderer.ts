import { BufferUtil } from "./buffer-util";
import { Camera } from "./camera";
import { Rect } from "./rect";
import { SpritePipeline } from "./sprite-pipeline";
import { Texture } from "./texture";

const MAX_NUMBER_OF_SPRITES = 1000;
const FLOAT_PER_VERTEX = 7;
const FLOATS_PER_SPRITE = 4 * FLOAT_PER_VERTEX;
const INIDICES_PER_SPRITE = 6; // 2 triangles per sprite

export class BatchDrawCall {
    constructor(public pipeline: SpritePipeline) { }
    public vertexData = new Float32Array(MAX_NUMBER_OF_SPRITES * FLOATS_PER_SPRITE);
    public instanceCount = 0;
}

export class SpriteRenderer {

    private currentTexture!: Texture;

    private indexBuffer!: GPUBuffer;
    private projectionViewMatrixBuffer!: GPUBuffer;

    private camera: Camera;

    private passEncoder!: GPURenderPassEncoder;

    /**
     * Pipelines created for each texture
     */
    private pipelinesPerTexture: { [id: string]: SpritePipeline } = {};

    /**
     * The draw calls per texture.
     */
    private batchDrawCallPerTexture: { [id: string]: Array<BatchDrawCall> } = {};

    /**
     * The buffers which are currently allocated and used for vertex data.
     */
    private allocatedVertexBuffers: Array<GPUBuffer> = [];

    constructor(private device: GPUDevice, private width: number, private height: number) {
        this.camera = new Camera(this.width, this.height);
    }

    private setupIndexBuffer() {
        const data = new Uint16Array(MAX_NUMBER_OF_SPRITES * INIDICES_PER_SPRITE);

        for (let i = 0; i < MAX_NUMBER_OF_SPRITES; i++) {
            // t1 
            data[i * INIDICES_PER_SPRITE + 0] = i * 4 + 0;
            data[i * INIDICES_PER_SPRITE + 1] = i * 4 + 1;
            data[i * INIDICES_PER_SPRITE + 2] = i * 4 + 2;

            // t2
            data[i * INIDICES_PER_SPRITE + 3] = i * 4 + 2;
            data[i * INIDICES_PER_SPRITE + 4] = i * 4 + 3;
            data[i * INIDICES_PER_SPRITE + 5] = i * 4 + 0;
        }

        this.indexBuffer = BufferUtil.createIndexBuffer(this.device, data);
    }

    public initialize() {

        this.projectionViewMatrixBuffer = BufferUtil.createUniformBuffer(this.device, new Float32Array(16));
        this.setupIndexBuffer();
    }

    public framePass(passEncoder: GPURenderPassEncoder) {
        this.passEncoder = passEncoder;

        this.batchDrawCallPerTexture = {};

        this.camera.update();

        this.device.queue.writeBuffer(
            this.projectionViewMatrixBuffer,
            0,
            this.camera.projectionViewMatrix as Float32Array);
    }


    public drawSprite(texture: Texture, rect: Rect) {

        if (this.currentTexture != texture) {
            this.currentTexture = texture;

            let pipeline = this.pipelinesPerTexture[texture.id];
            if (!pipeline) {
                pipeline = SpritePipeline.create(this.device, texture, this.projectionViewMatrixBuffer);
                this.pipelinesPerTexture[texture.id] = pipeline;
            }

            let batchDrawCalls = this.batchDrawCallPerTexture[texture.id];
            if (!batchDrawCalls) {
                this.batchDrawCallPerTexture[texture.id] = [];
            }
        }

        const arrayOfBatchCalls = this.batchDrawCallPerTexture[texture.id];
        let batchDrawCall = arrayOfBatchCalls[arrayOfBatchCalls.length - 1]
        if (!batchDrawCall) {
            batchDrawCall = new BatchDrawCall(this.pipelinesPerTexture[texture.id]);
            this.batchDrawCallPerTexture[texture.id].push(batchDrawCall);
        }

        let i = batchDrawCall.instanceCount * FLOATS_PER_SPRITE;

        // top left 
        batchDrawCall.vertexData[0 + i] = rect.x;
        batchDrawCall.vertexData[1 + i] = rect.y;
        batchDrawCall.vertexData[2 + i] = 0.0;
        batchDrawCall.vertexData[3 + i] = 0.0;
        batchDrawCall.vertexData[4 + i] = 1.0;
        batchDrawCall.vertexData[5 + i] = 1.0;
        batchDrawCall.vertexData[6 + i] = 1.0;

        // top right
        batchDrawCall.vertexData[7 + i] = rect.x + rect.width;
        batchDrawCall.vertexData[8 + i] = rect.y;
        batchDrawCall.vertexData[9 + i] = 1.0;
        batchDrawCall.vertexData[10 + i] = 0.0;
        batchDrawCall.vertexData[11 + i] = 1.0;
        batchDrawCall.vertexData[12 + i] = 1.0;
        batchDrawCall.vertexData[13 + i] = 1.0;

        // bottom right
        batchDrawCall.vertexData[14 + i] = rect.x + rect.width;
        batchDrawCall.vertexData[15 + i] = rect.y + rect.height;
        batchDrawCall.vertexData[16 + i] = 1.0;
        batchDrawCall.vertexData[17 + i] = 1.0;
        batchDrawCall.vertexData[18 + i] = 1.0;
        batchDrawCall.vertexData[19 + i] = 1.0;
        batchDrawCall.vertexData[20 + i] = 1.0;

        // bottom left
        batchDrawCall.vertexData[21 + i] = rect.x;
        batchDrawCall.vertexData[22 + i] = rect.y + rect.height;
        batchDrawCall.vertexData[23 + i] = 0.0;
        batchDrawCall.vertexData[24 + i] = 1.0;
        batchDrawCall.vertexData[25 + i] = 1.0;
        batchDrawCall.vertexData[26 + i] = 1.0;
        batchDrawCall.vertexData[27 + i] = 1.0;


        batchDrawCall.instanceCount++;

        if (batchDrawCall.instanceCount >= MAX_NUMBER_OF_SPRITES ) {
            const newBatchDrawCall = new BatchDrawCall(this.pipelinesPerTexture[texture.id]);
            this.batchDrawCallPerTexture[texture.id].push(newBatchDrawCall);
        }

    }

    public frameEnd() {

        let usedVertexBuffers = [];

        for (const key in this.batchDrawCallPerTexture) {

            const arrayOfBatchDrawCalls = this.batchDrawCallPerTexture[key];

            for (const batchDrawCall of arrayOfBatchDrawCalls) {

                if (batchDrawCall.instanceCount == 0) continue;

                let vertexBuffer = this.allocatedVertexBuffers.pop();
                if (!vertexBuffer) {
                    vertexBuffer = BufferUtil.createVertexBuffer(this.device, batchDrawCall.vertexData);
                }
                else {
                    this.device.queue.writeBuffer(vertexBuffer, 0, batchDrawCall.vertexData);
                }


                usedVertexBuffers.push(vertexBuffer);
                const spritePipeline = batchDrawCall.pipeline;

                // DRAW HERE
                this.passEncoder.setPipeline(spritePipeline.pipeline);
                this.passEncoder.setIndexBuffer(this.indexBuffer, "uint16");
                this.passEncoder.setVertexBuffer(0, vertexBuffer);
                this.passEncoder.setBindGroup(0, spritePipeline.projectionViewBindGroup);
                this.passEncoder.setBindGroup(1, spritePipeline.textureBindGroup);
                this.passEncoder.drawIndexed(6 * batchDrawCall.instanceCount); // draw 3 vertices
            }

        }

        for (let vertexBuffer of usedVertexBuffers) {
            this.allocatedVertexBuffers.push(vertexBuffer);
        }
    }
}