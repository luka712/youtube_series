import { BufferUtil } from "./buffer-util";
import { Camera } from "./camera";
import { ProgramUtil } from "./program-util";
import { Rect } from "./rect";
import { Texture } from "./texture";
import vertexShaderSource from "./shaders/vshader.glsl?raw";
import fragmentShaderSource from "./shaders/fshader.glsl?raw";
import { Color } from "./color";
import { vec2 } from "gl-matrix";
import { SpriteFont } from "./sprite-font";

const MAX_NUMBER_OF_SPRITES = 1000;
const FLOATS_PER_VERTEX = 7;
const FLOATS_PER_SPRITE = 4 * FLOATS_PER_VERTEX;
const INDICES_PER_SPRITE = 6;

export class SpriteRenderer {

    private instanceCount = 0;
    private currentTexture: Texture | null = null;
    private defaultColor = new Color();

    private projectionViewMatrixLocation!: WebGLUniformLocation;
    private camera!: Camera;

    private vao!: WebGLVertexArrayObject;
    private buffer!: WebGLBuffer;
    private indexBuffer!: WebGLBuffer;
    private data: Float32Array = new Float32Array(FLOATS_PER_SPRITE * MAX_NUMBER_OF_SPRITES);
   
    private program!: WebGLProgram;

    private v0: vec2 = vec2.create();
    private v1: vec2 = vec2.create();
    private v2: vec2 = vec2.create();
    private v3: vec2 = vec2.create();
    private _rotationOrigin = vec2.create();

    constructor(private gl: WebGL2RenderingContext,
        private width: number, private height: number) {

    }

    private setupIndexBuffer() {

        const data = new Uint16Array(MAX_NUMBER_OF_SPRITES * INDICES_PER_SPRITE);

        for (let i = 0; i < MAX_NUMBER_OF_SPRITES; i++) {

            // t1
            data[i * INDICES_PER_SPRITE + 0] = i * 4 + 0;
            data[i * INDICES_PER_SPRITE + 1] = i * 4 + 1;
            data[i * INDICES_PER_SPRITE + 2] = i * 4 + 3;

            // 2
            data[i * INDICES_PER_SPRITE + 3] = i * 4 + 1;
            data[i * INDICES_PER_SPRITE + 4] = i * 4 + 2;
            data[i * INDICES_PER_SPRITE + 5] = i * 4 + 3;

        }

        this.indexBuffer = BufferUtil.createIndexBuffer(this.gl, data);
    }

    public async initialize() {

        this.camera = new Camera(this.width, this.height);

        const vertexShader = ProgramUtil.createShader(this.gl, this.gl.VERTEX_SHADER, vertexShaderSource);
        const fragmentShader = ProgramUtil.createShader(this.gl, this.gl.FRAGMENT_SHADER, fragmentShaderSource);

        this.program = ProgramUtil.createProgram(this.gl, vertexShader, fragmentShader);
        this.projectionViewMatrixLocation = this.gl.getUniformLocation(this.program, "projectionViewMatrix")!;


        this.gl.useProgram(this.program);

        this.vao = this.gl.createVertexArray()!;
        this.gl.bindVertexArray(this.vao);

        this.buffer = BufferUtil.createArrayBuffer(this.gl, this.data);

        const stride = 2 * Float32Array.BYTES_PER_ELEMENT + 2 * Float32Array.BYTES_PER_ELEMENT + 3 * Float32Array.BYTES_PER_ELEMENT;

        this.gl.vertexAttribPointer(0, 2, this.gl.FLOAT, false, stride, 0);
        this.gl.enableVertexAttribArray(0);

        this.gl.vertexAttribPointer(1, 2, this.gl.FLOAT, false, stride, 2 * Float32Array.BYTES_PER_ELEMENT);
        this.gl.enableVertexAttribArray(1);

        this.gl.vertexAttribPointer(2, 3, this.gl.FLOAT, false, stride, 4 * Float32Array.BYTES_PER_ELEMENT);
        this.gl.enableVertexAttribArray(2);

        this.setupIndexBuffer();

        this.gl.bindVertexArray(null);
    }

    public begin() {
        this.instanceCount = 0;
        this.camera.update();

        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

        this.gl.useProgram(this.program);
        this.gl.uniformMatrix4fv(this.projectionViewMatrixLocation, false, this.camera.projectionViewMatrix);

        this.gl.bindVertexArray(this.vao);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer);
    }

    public drawSprite(texture: Texture, rect: Rect, color: Color = this.defaultColor, rotation = 0, rotationOrigin: vec2 | null = null) {

        if (this.currentTexture != texture) {

            this.end();
            this.gl.bindTexture(this.gl.TEXTURE_2D, texture.texture);
            this.currentTexture = texture;
        }
        let i = this.instanceCount * FLOATS_PER_SPRITE;

        this.v0[0] = rect.x;
        this.v0[1] = rect.y;
        this.v1[0] = rect.x + rect.width;
        this.v1[1] = rect.y;
        this.v2[0] = rect.x + rect.width;
        this.v2[1] = rect.y + rect.height;
        this.v3[0] = rect.x;
        this.v3[1] = rect.y + rect.height;


        if (rotation != 0) {
            this._rotationOrigin[0] = rect.x;
            this._rotationOrigin[1] = rect.y;

            if (rotationOrigin != null) {
                this._rotationOrigin[0] += rect.width * rotationOrigin[0];
                this._rotationOrigin[1] += rect.width * rotationOrigin[1];
            }

            vec2.rotate(this.v0, this.v0, this._rotationOrigin, rotation);
            vec2.rotate(this.v1, this.v1, this._rotationOrigin, rotation);
            vec2.rotate(this.v2, this.v2, this._rotationOrigin, rotation);
            vec2.rotate(this.v3, this.v3, this._rotationOrigin, rotation);
        }


        // top left 
        this.data[0 + i] = this.v0[0]; // x 
        this.data[1 + i] = this.v0[1]; // y 
        this.data[2 + i] = 0;      // u
        this.data[3 + i] = 1;      // v
        this.data[4 + i] = color.r;      // r
        this.data[5 + i] = color.g;      // g
        this.data[6 + i] = color.b;      // b

        // top right
        this.data[7 + i] = this.v1[0]; // x
        this.data[8 + i] = this.v1[1];              // y
        this.data[9 + i] = 1;                   // u
        this.data[10 + i] = 1;                  // v
        this.data[11 + i] = color.r;                  // r
        this.data[12 + i] = color.g;                  // g
        this.data[13 + i] = color.b;                  // b

        // bottom right
        this.data[14 + i] = this.v2[0]; // x
        this.data[15 + i] = this.v2[1]; // y
        this.data[16 + i] = 1;                   // u
        this.data[17 + i] = 0;                   // v
        this.data[18 + i] = color.r;                   // r
        this.data[19 + i] = color.g;                   // g
        this.data[20 + i] = color.b;                   // b

        // bottom left
        this.data[21 + i] = this.v3[0]; // x
        this.data[22 + i] = this.v3[1]; // y
        this.data[23 + i] = 0;                   // u
        this.data[24 + i] = 0;                   // v
        this.data[25 + i] = color.r;                   // r
        this.data[26 + i] = color.g;                   // g
        this.data[27 + i] = color.b;                   // b

        this.instanceCount++;

        if (this.instanceCount >= MAX_NUMBER_OF_SPRITES) {
            this.end();
        }
    }

    public drawSpriteSource(texture: Texture, rect: Rect, sourceRect: Rect,
        color: Color = this.defaultColor, rotation = 0, rotationOrigin: vec2 | null = null) {

        if (this.currentTexture != texture) {

            this.end();
            this.gl.bindTexture(this.gl.TEXTURE_2D, texture.texture);
            this.currentTexture = texture;
        }
        let i = this.instanceCount * FLOATS_PER_SPRITE;

        this.v0[0] = rect.x;
        this.v0[1] = rect.y;
        this.v1[0] = rect.x + rect.width;
        this.v1[1] = rect.y;
        this.v2[0] = rect.x + rect.width;
        this.v2[1] = rect.y + rect.height;
        this.v3[0] = rect.x;
        this.v3[1] = rect.y + rect.height;


        if (rotation != 0) {
            this._rotationOrigin[0] = rect.x;
            this._rotationOrigin[1] = rect.y;

            if (rotationOrigin != null) {
                this._rotationOrigin[0] += rect.width * rotationOrigin[0];
                this._rotationOrigin[1] += rect.width * rotationOrigin[1];
            }

            vec2.rotate(this.v0, this.v0, this._rotationOrigin, rotation);
            vec2.rotate(this.v1, this.v1, this._rotationOrigin, rotation);
            vec2.rotate(this.v2, this.v2, this._rotationOrigin, rotation);
            vec2.rotate(this.v3, this.v3, this._rotationOrigin, rotation);
        }

        let u0 = sourceRect.x / texture.width;
        let v0 = 1 - sourceRect.y / texture.height;
        let u1 = (sourceRect.x + sourceRect.width) / texture.width;
        let v1 = 1 - (sourceRect.y + sourceRect.height) / texture.height;

        // top left 
        this.data[0 + i] = this.v0[0]; // x 
        this.data[1 + i] = this.v0[1]; // y 
        this.data[2 + i] = u0;      // u
        this.data[3 + i] = v0;      // v
        this.data[4 + i] = color.r;      // r
        this.data[5 + i] = color.g;      // g
        this.data[6 + i] = color.b;      // b

        // top right
        this.data[7 + i] = this.v1[0]; // x
        this.data[8 + i] = this.v1[1];              // y
        this.data[9 + i] = u1;                   // u
        this.data[10 + i] = v0;                  // v
        this.data[11 + i] = color.r;                  // r
        this.data[12 + i] = color.g;                  // g
        this.data[13 + i] = color.b;                  // b

        // bottom right
        this.data[14 + i] = this.v2[0]; // x
        this.data[15 + i] = this.v2[1]; // y
        this.data[16 + i] = u1;                   // u
        this.data[17 + i] = v1;                   // v
        this.data[18 + i] = color.r;                   // r
        this.data[19 + i] = color.g;                   // g
        this.data[20 + i] = color.b;                   // b

        // bottom left
        this.data[21 + i] = this.v3[0]; // x
        this.data[22 + i] = this.v3[1]; // y
        this.data[23 + i] = u0;                   // u
        this.data[24 + i] = v1;                   // v
        this.data[25 + i] = color.r;                   // r
        this.data[26 + i] = color.g;                   // g
        this.data[27 + i] = color.b;                   // b

        this.instanceCount++;

        if (this.instanceCount >= MAX_NUMBER_OF_SPRITES) {
            this.end();
        }
    }

    public drawString(font: SpriteFont, text: string, 
        position: vec2, color: Color = this.defaultColor, 
        scale = 1) {


        if (this.currentTexture != font.texture.texture) {

            this.end();
            this.gl.bindTexture(this.gl.TEXTURE_2D, font.texture.texture);
            this.currentTexture = font.texture;
        }

        let nextCharX = 0;
        for (const stringChar of text) {
            const charCode = stringChar.charCodeAt(0);
            const char = font.getChar(charCode);

            let i = this.instanceCount * FLOATS_PER_SPRITE;

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

            const a = char.textureCoords.a;
            const b = char.textureCoords.b;
            const c = char.textureCoords.c;
            const d = char.textureCoords.d;

            // top left 
            this.data[0 + i] = this.v0[0]; // x 
            this.data[1 + i] = this.v0[1]; // y 
            this.data[2 + i] = a[0];      // u
            this.data[3 + i] = a[1];      // v
            this.data[4 + i] = color.r;      // r
            this.data[5 + i] = color.g;      // g
            this.data[6 + i] = color.b;      // b

            // top right
            this.data[7 + i] = this.v1[0]; // x
            this.data[8 + i] = this.v1[1];              // y
            this.data[9 + i] = b[0];                   // u
            this.data[10 + i] = b[1];                  // v
            this.data[11 + i] = color.r;                  // r
            this.data[12 + i] = color.g;                  // g
            this.data[13 + i] = color.b;                  // b

            // bottom right
            this.data[14 + i] = this.v2[0]; // x
            this.data[15 + i] = this.v2[1]; // y
            this.data[16 + i] = c[0];                   // u
            this.data[17 + i] = c[1];                   // v
            this.data[18 + i] = color.r;                   // r
            this.data[19 + i] = color.g;                   // g
            this.data[20 + i] = color.b;                   // b

            // bottom left
            this.data[21 + i] = this.v3[0]; // x
            this.data[22 + i] = this.v3[1]; // y
            this.data[23 + i] = d[0];                   // u
            this.data[24 + i] = d[1];                   // v
            this.data[25 + i] = color.r;                   // r
            this.data[26 + i] = color.g;                   // g
            this.data[27 + i] = color.b;                   // b

            this.instanceCount++;

            nextCharX += char.advance;

            if (this.instanceCount >= MAX_NUMBER_OF_SPRITES) {
                this.end();
            }

        }
    }

    public end() {

        this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, this.data);
        this.gl.drawElements(this.gl.TRIANGLES, 6 * this.instanceCount, this.gl.UNSIGNED_SHORT, 0);
        this.instanceCount = 0;
    }
}