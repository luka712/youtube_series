import vertexShaderSource from "./shaders/vshader.glsl?raw";
import fragmentShaderSource from "./shaders/fshader.glsl?raw";
import { Texture } from "./texture";
import { Content } from "./content";
import { Camera } from "./camera";
import { Rect } from "./rect";




export class Renderer {
    private canvas!: HTMLCanvasElement;
    private gl!: WebGL2RenderingContext;

    private projectionViewMatrixLocation!: WebGLUniformLocation;
    private camera!: Camera;

    private buffer!: WebGLBuffer;
    private data: Float32Array = new Float32Array(7 * 4);


    private program!: WebGLProgram;

    constructor() {

    }

    public async initialize() {
        this.canvas = document.getElementById("canvas") as HTMLCanvasElement;
        this.gl = this.canvas.getContext("webgl2")!;
        this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);

        this.camera = new Camera(this.canvas.width, this.canvas.height);

        await Content.initialize(this.gl);

        const vertexShader = this.createShader(this.gl.VERTEX_SHADER, vertexShaderSource);
        const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, fragmentShaderSource);

        this.program = this.createProgram(vertexShader, fragmentShader);
        this.projectionViewMatrixLocation = this.gl.getUniformLocation(this.program, "projectionViewMatrix")!;


        this.gl.useProgram(this.program);

        this.buffer = this.createArrayBuffer(this.data);

        const stride = 2 * Float32Array.BYTES_PER_ELEMENT + 2 * Float32Array.BYTES_PER_ELEMENT + 3 * Float32Array.BYTES_PER_ELEMENT;

        this.gl.vertexAttribPointer(0, 2, this.gl.FLOAT, false, stride, 0);
        this.gl.enableVertexAttribArray(0);

        this.gl.vertexAttribPointer(1, 2, this.gl.FLOAT, false, stride, 2 * Float32Array.BYTES_PER_ELEMENT);
        this.gl.enableVertexAttribArray(1);

        this.gl.vertexAttribPointer(2, 3, this.gl.FLOAT, false, stride, 4 * Float32Array.BYTES_PER_ELEMENT);
        this.gl.enableVertexAttribArray(2);

        const indexBuffer = this.createIndexBuffer(new Uint8Array([
            0, 1, 3,
            1, 2, 3
        ]));
    }






    /**
     * Create a WebGL program from given vertex and fragment shader.
     * @param vertexShader vertex shader
     * @param fragmentShader fragment shader 
     * @returns the created program
     */
    private createProgram(vertexShader: WebGLShader, fragmentShader: WebGLShader): WebGLProgram {
        const program = this.gl.createProgram()!;
        this.gl.attachShader(program, vertexShader);
        this.gl.attachShader(program, fragmentShader);

        this.gl.linkProgram(program);

        const linked = this.gl.getProgramParameter(program, this.gl.LINK_STATUS);
        if (!linked) {
            const programError = this.gl.getProgramInfoLog(program);
            console.warn("Program linking failed: " + programError);
        }

        return program;
    }

    /**
     * Creates a shader for given type and source.
     * @param type WebGL shader type
     * @param source shader source code
     * @returns the created shader 
     */
    private createShader(type: number, source: string): WebGLShader {
        const shader = this.gl.createShader(type)!;

        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);

        const compiled = this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS);
        if (!compiled) {
            const shaderError = this.gl.getShaderInfoLog(shader);
            console.warn("Shader compilation failed: " + shaderError);
        }

        return shader;
    }

    /**
     * Creates a WebGL buffer from given data.
     * @param data the data to be stored in the buffer
     * @returns the created buffer
     */
    private createArrayBuffer(data: Float32Array): WebGLBuffer {
        const buffer = this.gl.createBuffer()!;
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, data, this.gl.STATIC_DRAW);

        return buffer;
    }

    private createIndexBuffer(data: Uint8Array | Uint16Array | Uint32Array): WebGLBuffer {

        const buffer = this.gl.createBuffer()!;
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, buffer);
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, data, this.gl.STATIC_DRAW);

        return buffer;
    }

    public drawSprite(texture: Texture, rect: Rect) {
        this.gl.useProgram(this.program);
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture.texture);
        this.gl.uniformMatrix4fv(this.projectionViewMatrixLocation, false, this.camera.projectionViewMatrix);

        // top left 
        this.data[0] = rect.x; // x 
        this.data[1] = rect.y; // y 
        this.data[2] = 0;      // u
        this.data[3] = 1;      // v
        this.data[4] = 1;      // r
        this.data[5] = 1;      // g
        this.data[6] = 1;      // b

        // top right
        this.data[7] = rect.x + rect.width; // x
        this.data[8] = rect.y;              // y
        this.data[9] = 1;                   // u
        this.data[10] = 1;                  // v
        this.data[11] = 1;                  // r
        this.data[12] = 1;                  // g
        this.data[13] = 1;                  // b

        // bottom right
        this.data[14] = rect.x + rect.width; // x
        this.data[15] = rect.y + rect.height; // y
        this.data[16] = 1;                   // u
        this.data[17] = 0;                   // v
        this.data[18] = 1;                   // r
        this.data[19] = 1;                   // g
        this.data[20] = 1;                   // b

        // bottom left
        this.data[21] = rect.x; // x
        this.data[22] = rect.y + rect.height; // y
        this.data[23] = 0;                   // u
        this.data[24] = 0;                   // v
        this.data[25] = 1;                   // r
        this.data[26] = 1;                   // g
        this.data[27] = 1;                   // b


        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer);
        this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, this.data);
        this.gl.drawElements(this.gl.TRIANGLES, 6, this.gl.UNSIGNED_BYTE, 0);
    }

    public draw(): void {

        this.camera.update();

        this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        this.gl.clearColor(0.8, 0.8, 0.8, 1);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);

        this.drawSprite(Content.playerTexture, new Rect(100, 100, 99, 75));
        this.drawSprite(Content.ufoBlue, new Rect(100, 300, 100, 100));
        this.drawSprite(Content.ufoBlue, new Rect(300, 100, 100, 100));



        // start game loop 
        window.requestAnimationFrame(() => this.draw());
    }

}