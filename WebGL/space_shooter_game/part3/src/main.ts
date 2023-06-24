import vertexShaderSource from "./shaders/vshader.glsl?raw";
import fragmentShaderSource from "./shaders/fshader.glsl?raw";

class Renderer {
    private canvas: HTMLCanvasElement;
    private gl: WebGL2RenderingContext;
    private texture: WebGLTexture;

    private program: WebGLProgram;

    constructor() {
        this.canvas = document.getElementById("canvas") as HTMLCanvasElement;
        this.gl = this.canvas.getContext("webgl2")!;
        this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);

        const vertexShader = this.createShader(this.gl.VERTEX_SHADER, vertexShaderSource);
        const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, fragmentShaderSource);

        this.program = this.createProgram(vertexShader, fragmentShader);

        this.texture = this.loadTexture("assets/texture-mapping-test-image.jpg");

        this.gl.useProgram(this.program);

        const positionBuffer = this.createArrayBuffer([
            -0.5, -0.5, // left bottom
            -0.5, 0.5, // left top
            0.5, -0.5, // right bottom
            -0.5, 0.5, // left top
            0.5, 0.5, // right top
            0.5, -0.5 // right bottom
        ]);

        this.gl.vertexAttribPointer(0, 2, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(0);

        const texCoords = [
            0, 0, // left bottom
            0, 1, // left top
            1, 0, // right bottom
            0, 1, // left top
            1, 1, // right top
            1, 0 // right bottom
        ]
        const texBuffer = this.createArrayBuffer(texCoords);
        this.gl.vertexAttribPointer(1, 2, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(1);

        const colorBuffer = this.createArrayBuffer([
            1, 1, 1,
            1, 1, 1,
            1, 1, 1,
            1, 1, 1,
            1, 1, 1,
            1, 1, 1,
        ]);

        this.gl.vertexAttribPointer(2, 3, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(2);
    }



    private loadTexture(uri: string): WebGLTexture {
        const texture = this.gl.createTexture()!;
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);

        this.gl.texImage2D(this.gl.TEXTURE_2D,
            0,
            this.gl.RGBA,
            1, // width
            1, // height
            0, // border
            this.gl.RGBA,
            this.gl.UNSIGNED_BYTE,
            new Uint8Array([255, 0, 255 , 255]));

        const image = new Image();
        image.onload = () => {
            this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
            this.gl.texImage2D(this.gl.TEXTURE_2D,
                0,
                this.gl.RGBA,
                this.gl.RGBA,
                this.gl.UNSIGNED_BYTE,
                image);
            this.gl.generateMipmap(this.gl.TEXTURE_2D);

        }
        image.src = uri;

        return texture;

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
    private createArrayBuffer(data: number[]): WebGLBuffer {
        const buffer = this.gl.createBuffer()!;
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(data), this.gl.STATIC_DRAW);

        return buffer;
    }



    public draw(): void {
        this.gl.clearColor(0.8, 0.8, 0.8, 1);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);

        this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);

        // start game loop 
        window.requestAnimationFrame(() => this.draw());
    }

}

const renderer = new Renderer();

renderer.draw();