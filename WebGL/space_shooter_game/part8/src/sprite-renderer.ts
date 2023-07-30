import { BufferUtil } from "./buffer-util";
import { Camera } from "./camera";
import { ProgramUtil } from "./program-util";
import { Rect } from "./rect";
import { Texture } from "./texture";
import vertexShaderSource from "./shaders/vshader.glsl?raw";
import fragmentShaderSource from "./shaders/fshader.glsl?raw";

const MAX_NUMBER_OF_SPRITES = 1000;
const FLOATS_PER_VERTEX = 7;
const FLOATS_PER_SPRITE = 4 * FLOATS_PER_VERTEX;
const INDICES_PER_SPRITE = 6;

export class SpriteRenderer {

    private instanceCount = 0;
    private currentTexture: Texture | null = null;

    private projectionViewMatrixLocation!: WebGLUniformLocation;
    private camera!: Camera;
    private buffer!: WebGLBuffer;
    private indexBuffer!: WebGLBuffer;
    private data: Float32Array = new Float32Array(FLOATS_PER_SPRITE * MAX_NUMBER_OF_SPRITES);
    private program!: WebGLProgram;

    constructor(private gl: WebGL2RenderingContext,
        private width: number, private height: number) {

    }

    private setupIndexBuffer() {

        const data = new Uint16Array(MAX_NUMBER_OF_SPRITES * INDICES_PER_SPRITE);

        for(let i = 0; i < MAX_NUMBER_OF_SPRITES; i++) {

            // t1
            data[i * INDICES_PER_SPRITE + 0] = i * 4 + 0;
            data[i * INDICES_PER_SPRITE + 1] = i * 4 + 1;
            data[i * INDICES_PER_SPRITE + 2] = i * 4 + 3;

            // 2
            data[i * INDICES_PER_SPRITE + 3] = i * 4 + 1;
            data[i * INDICES_PER_SPRITE + 4] = i * 4 + 2;
            data[i * INDICES_PER_SPRITE + 5] = i * 4 + 3;

        }

        this.indexBuffer = BufferUtil.createIndexBuffer(this.gl,data);
    }

    public async initialize() {

        this.camera = new Camera(this.width, this.height);

        const vertexShader = ProgramUtil.createShader(this.gl, this.gl.VERTEX_SHADER, vertexShaderSource);
        const fragmentShader = ProgramUtil.createShader(this.gl, this.gl.FRAGMENT_SHADER, fragmentShaderSource);

        this.program = ProgramUtil.createProgram(this.gl, vertexShader, fragmentShader);
        this.projectionViewMatrixLocation = this.gl.getUniformLocation(this.program, "projectionViewMatrix")!;


        this.gl.useProgram(this.program);

        this.buffer = BufferUtil.createArrayBuffer(this.gl, this.data);

        const stride = 2 * Float32Array.BYTES_PER_ELEMENT + 2 * Float32Array.BYTES_PER_ELEMENT + 3 * Float32Array.BYTES_PER_ELEMENT;

        this.gl.vertexAttribPointer(0, 2, this.gl.FLOAT, false, stride, 0);
        this.gl.enableVertexAttribArray(0);

        this.gl.vertexAttribPointer(1, 2, this.gl.FLOAT, false, stride, 2 * Float32Array.BYTES_PER_ELEMENT);
        this.gl.enableVertexAttribArray(1);

        this.gl.vertexAttribPointer(2, 3, this.gl.FLOAT, false, stride, 4 * Float32Array.BYTES_PER_ELEMENT);
        this.gl.enableVertexAttribArray(2);

        this.setupIndexBuffer();
    }

    public begin() {
        this.instanceCount = 0;
        this.camera.update();

        this.gl.enable(this.gl.BLEND);
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);

        this.gl.useProgram(this.program);
        this.gl.uniformMatrix4fv(this.projectionViewMatrixLocation, false, this.camera.projectionViewMatrix);

        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer);

    }

    public drawSprite(texture: Texture, rect: Rect) {

        if(this.currentTexture != texture){
            
            this.end();
            this.gl.bindTexture(this.gl.TEXTURE_2D, texture.texture);
            this.currentTexture = texture;
        }
        let i = this.instanceCount * FLOATS_PER_SPRITE;

        // top left 
        this.data[0 + i] = rect.x; // x 
        this.data[1 + i] = rect.y; // y 
        this.data[2 + i] = 0;      // u
        this.data[3 + i] = 1;      // v
        this.data[4 + i] = 1;      // r
        this.data[5 + i] = 1;      // g
        this.data[6 + i] = 1;      // b

        // top right
        this.data[7 + i] = rect.x + rect.width; // x
        this.data[8 + i] = rect.y;              // y
        this.data[9 + i] = 1;                   // u
        this.data[10 + i] = 1;                  // v
        this.data[11 + i] = 1;                  // r
        this.data[12 + i] = 1;                  // g
        this.data[13 + i] = 1;                  // b

        // bottom right
        this.data[14 + i] = rect.x + rect.width; // x
        this.data[15 + i] = rect.y + rect.height; // y
        this.data[16 + i] = 1;                   // u
        this.data[17 + i] = 0;                   // v
        this.data[18 + i] = 1;                   // r
        this.data[19 + i] = 1;                   // g
        this.data[20 + i] = 1;                   // b

        // bottom left
        this.data[21 + i] = rect.x; // x
        this.data[22 + i] = rect.y + rect.height; // y
        this.data[23 + i] = 0;                   // u
        this.data[24 + i] = 0;                   // v
        this.data[25 + i] = 1;                   // r
        this.data[26 + i] = 1;                   // g
        this.data[27 + i] = 1;                   // b

        this.instanceCount++;

        if(this.instanceCount >= MAX_NUMBER_OF_SPRITES){
             this.end();
        }
    }

    public end() {
        
        this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, this.data);
        this.gl.drawElements(this.gl.TRIANGLES, 6 * this.instanceCount, this.gl.UNSIGNED_SHORT, 0);
        this.instanceCount = 0;
    }
}