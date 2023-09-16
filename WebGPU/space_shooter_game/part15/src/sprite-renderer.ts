import { vec2 } from "gl-matrix";
import { BufferUtil } from "./buffer-util";
import { Camera } from "./camera";
import { Color } from "./color";
import { Rect } from "./rect";
import { SpritePipeline } from "./sprite-pipeline";
import { Texture } from "./texture";
import { SpriteFont } from "./sprite-font";

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

    private defaultColor = new Color();
    private currentTexture: Texture | null = null;

    private indexBuffer!: GPUBuffer;
    private projectionViewMatrixBuffer!: GPUBuffer;

    private camera: Camera;

    private passEncoder!: GPURenderPassEncoder;

    private v0 = vec2.create();
    private v1 = vec2.create();
    private v2 = vec2.create();
    private v3 = vec2.create();
    private rotationOrigin = vec2.create();

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

        this.currentTexture = null;

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

        if (batchDrawCall.instanceCount >= MAX_NUMBER_OF_SPRITES) {
            const newBatchDrawCall = new BatchDrawCall(this.pipelinesPerTexture[texture.id]);
            this.batchDrawCallPerTexture[texture.id].push(newBatchDrawCall);
        }

    }

    public drawSpriteSource(texture: Texture, rect: Rect, sourceRect: Rect,
        color: Color = this.defaultColor, rotation = 0, rotationAnchor: vec2 | null = null) {

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

        let u0 = sourceRect.x / texture.width;
        let v0 = sourceRect.y / texture.height;
        let u1 = (sourceRect.x + sourceRect.width) / texture.width;
        let v1 = (sourceRect.y + sourceRect.height) / texture.height;

        this.v0[0] = rect.x;
        this.v0[1] = rect.y;
        this.v1[0] = rect.x + rect.width;
        this.v1[1] = rect.y;
        this.v2[0] = rect.x + rect.width;
        this.v2[1] = rect.y + rect.height;
        this.v3[0] = rect.x;
        this.v3[1] = rect.y + rect.height;

        if (rotation != 0) {
            if (rotationAnchor == null) {
                vec2.copy(this.rotationOrigin, this.v0);
            }
            else {
                this.rotationOrigin[0] = this.v0[0] + rotationAnchor[0] * rect.width;
                this.rotationOrigin[1] = this.v0[1] + rotationAnchor[1] * rect.height;
            }

            vec2.rotate(this.v0, this.v0, this.rotationOrigin, rotation);
            vec2.rotate(this.v1, this.v1, this.rotationOrigin, rotation);
            vec2.rotate(this.v2, this.v2, this.rotationOrigin, rotation);
            vec2.rotate(this.v3, this.v3, this.rotationOrigin, rotation);
        }

        // top left 
        batchDrawCall.vertexData[0 + i] = this.v0[0];
        batchDrawCall.vertexData[1 + i] = this.v0[1];
        batchDrawCall.vertexData[2 + i] = u0;
        batchDrawCall.vertexData[3 + i] = v0;
        batchDrawCall.vertexData[4 + i] = color.r;
        batchDrawCall.vertexData[5 + i] = color.g;
        batchDrawCall.vertexData[6 + i] = color.b;

        // top right
        batchDrawCall.vertexData[7 + i] = this.v1[0];
        batchDrawCall.vertexData[8 + i] = this.v1[1];
        batchDrawCall.vertexData[9 + i] = u1;
        batchDrawCall.vertexData[10 + i] = v0;
        batchDrawCall.vertexData[11 + i] = color.r;
        batchDrawCall.vertexData[12 + i] = color.g;
        batchDrawCall.vertexData[13 + i] = color.b;

        // bottom right
        batchDrawCall.vertexData[14 + i] = this.v2[0];
        batchDrawCall.vertexData[15 + i] = this.v2[1];
        batchDrawCall.vertexData[16 + i] = u1;
        batchDrawCall.vertexData[17 + i] = v1;
        batchDrawCall.vertexData[18 + i] = color.r;
        batchDrawCall.vertexData[19 + i] = color.g;
        batchDrawCall.vertexData[20 + i] = color.b;

        // bottom left
        batchDrawCall.vertexData[21 + i] = this.v3[0];
        batchDrawCall.vertexData[22 + i] = this.v3[1];
        batchDrawCall.vertexData[23 + i] = u0;
        batchDrawCall.vertexData[24 + i] = v1;
        batchDrawCall.vertexData[25 + i] = color.r;
        batchDrawCall.vertexData[26 + i] = color.g;
        batchDrawCall.vertexData[27 + i] = color.b;


        batchDrawCall.instanceCount++;

        if (batchDrawCall.instanceCount >= MAX_NUMBER_OF_SPRITES) {
            const newBatchDrawCall = new BatchDrawCall(this.pipelinesPerTexture[texture.id]);
            this.batchDrawCallPerTexture[texture.id].push(newBatchDrawCall);
        }

    }

    public drawString(font: SpriteFont, text: string,
        position: vec2, color: Color = this.defaultColor, scale = 1) {

        const texture = font.texture;
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

        let nextCharX = 0;
        for (let j = 0; j < text.length; j++) {

            const charCode = text[j].charCodeAt(0);
            const char = font.getChar(charCode);

            let i = batchDrawCall.instanceCount * FLOATS_PER_SPRITE;

            const x = position[0] + (nextCharX + char.offset[0]) * scale;
            const y = position[1] + char.offset[1] * scale;
            const width = char.size[0] * scale;
            const height = char.size[1] * scale;

            this.v0[0] = x;
            this.v0[1] = y;
            this.v1[0] = x + width;
            this.v1[1] = y;
            this.v2[0] = x + width;
            this.v2[1] = y + height;
            this.v3[0] = x;
            this.v3[1] = y + height;

            const a = char.textureCoords.topLeft;
            const b = char.textureCoords.topRight;
            const c = char.textureCoords.bottomRight;
            const d = char.textureCoords.bottomLeft;

            // top left 
            batchDrawCall.vertexData[0 + i] = this.v0[0];
            batchDrawCall.vertexData[1 + i] = this.v0[1];
            batchDrawCall.vertexData[2 + i] = a[0];
            batchDrawCall.vertexData[3 + i] = a[1];
            batchDrawCall.vertexData[4 + i] = color.r;
            batchDrawCall.vertexData[5 + i] = color.g;
            batchDrawCall.vertexData[6 + i] = color.b;

            // top right
            batchDrawCall.vertexData[7 + i] = this.v1[0];
            batchDrawCall.vertexData[8 + i] = this.v1[1];
            batchDrawCall.vertexData[9 + i] = b[0];
            batchDrawCall.vertexData[10 + i] = b[1];
            batchDrawCall.vertexData[11 + i] = color.r;
            batchDrawCall.vertexData[12 + i] = color.g;
            batchDrawCall.vertexData[13 + i] = color.b;

            // bottom right
            batchDrawCall.vertexData[14 + i] = this.v2[0];
            batchDrawCall.vertexData[15 + i] = this.v2[1];
            batchDrawCall.vertexData[16 + i] = c[0];
            batchDrawCall.vertexData[17 + i] = c[1];
            batchDrawCall.vertexData[18 + i] = color.r;
            batchDrawCall.vertexData[19 + i] = color.g;
            batchDrawCall.vertexData[20 + i] = color.b;

            // bottom left
            batchDrawCall.vertexData[21 + i] = this.v3[0];
            batchDrawCall.vertexData[22 + i] = this.v3[1];
            batchDrawCall.vertexData[23 + i] = d[0];
            batchDrawCall.vertexData[24 + i] = d[1];
            batchDrawCall.vertexData[25 + i] = color.r;
            batchDrawCall.vertexData[26 + i] = color.g;
            batchDrawCall.vertexData[27 + i] = color.b;


            batchDrawCall.instanceCount++;

            nextCharX += char.advance;

            if (batchDrawCall.instanceCount >= MAX_NUMBER_OF_SPRITES) {
                batchDrawCall = new BatchDrawCall(this.pipelinesPerTexture[texture.id]);
                this.batchDrawCallPerTexture[texture.id].push(batchDrawCall);
            }
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