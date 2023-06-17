import vertexShaderSource from "./shaders/vshader.glsl?raw";
import fragmentShaderSource from "./shaders/fshader.glsl?raw";

class Renderer 
{
    private canvas :HTMLCanvasElement;
    private gl: WebGL2RenderingContext;

    private program: WebGLProgram;

    constructor()
    {
        this.canvas = document.getElementById("canvas") as HTMLCanvasElement;
        this.gl = this.canvas.getContext("webgl2")!;

        const vertexShader = this.createShader(this.gl.VERTEX_SHADER, vertexShaderSource);
        const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, fragmentShaderSource);

        this.program = this.createProgram(vertexShader, fragmentShader);

        this.gl.useProgram(this.program);

        const positionBuffer = this.createArrayBuffer([
            -0.5, -0.5,
            -0.5, 0.5,
            0.5, -0.5
        ]);

        this.gl.vertexAttribPointer(0, 2, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(0);

        const colorBuffer = this.createArrayBuffer([
            1, 0, 0,
            0, 1, 0,
            0, 0, 1
        ]);

        this.gl.vertexAttribPointer(1, 3, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(1);


    }


    /**
     * Create a WebGL program from given vertex and fragment shader.
     * @param vertexShader vertex shader
     * @param fragmentShader fragment shader 
     * @returns the created program
     */
    private createProgram(vertexShader: WebGLShader, fragmentShader: WebGLShader): WebGLProgram
    {
        const program = this.gl.createProgram()!;
        this.gl.attachShader(program, vertexShader);
        this.gl.attachShader(program, fragmentShader);

        this.gl.linkProgram(program);

        const linked = this.gl.getProgramParameter(program, this.gl.LINK_STATUS);
        if(!linked)
        {
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
    private createShader(type: number, source: string): WebGLShader
    {
        const shader = this.gl.createShader(type)!;

        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        
        const compiled = this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS);
        if(!compiled)
        {
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
    private createArrayBuffer(data: number[]): WebGLBuffer
    {
        const buffer = this.gl.createBuffer()!;
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(data), this.gl.STATIC_DRAW);

        return buffer;
    } 



    public draw(): void
    {
        this.gl.clearColor(0.8, 0.8, 0.8, 1);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);

        this.gl.drawArrays(this.gl.TRIANGLES, 0, 3);
    }

}

const renderer = new Renderer();

renderer.draw();