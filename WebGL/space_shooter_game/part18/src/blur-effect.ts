import { BufferUtil } from "./buffer-util";
import { FramebufferUtil } from "./framebuffer-util";
import { ProgramUtil } from "./program-util";
import vertexShaderSource from "./shaders/postProcessVShader.glsl?raw";
import fragmentShaderSource from "./shaders/postProcessBlurHorizontalPass.glsl?raw";
import fragmentShaderSource2 from "./shaders/postProcessBlurVerticalPass.glsl?raw";

export class BlurEffect {

    private glHorizontalPassProgram: WebGLProgram;
    private glHorizontalFramebuffer: WebGLFramebuffer;
    private glHorizontalTexture: WebGLTexture;

    private glVerticalPassProgram: WebGLProgram;
    private glVerticalFramebuffer: WebGLFramebuffer;
    private glVerticalTexture: WebGLTexture;

    public doHorizontalPass = true;
    public doVerticalPass = true;


    private vao: WebGLVertexArrayObject;
    private buffer: WebGLBuffer;

    constructor(private gl: WebGL2RenderingContext,
        private width: number,
        private height: number) {

        const vShader = ProgramUtil.createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
        const fShader = ProgramUtil.createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
        this.glHorizontalPassProgram = ProgramUtil.createProgram(gl, vShader, fShader);

        const fShader2 = ProgramUtil.createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource2);
        this.glVerticalPassProgram = ProgramUtil.createProgram(gl, vShader, fShader2);

        const result = FramebufferUtil.createFramebuffer(gl, width, height);
        this.glHorizontalFramebuffer = result.glFramebuffer!;
        this.glHorizontalTexture = result.glTexture!;

        const result2 = FramebufferUtil.createFramebuffer(gl, width, height);
        this.glVerticalFramebuffer = result2.glFramebuffer!;
        this.glVerticalTexture = result2.glTexture!;

        this.vao = gl.createVertexArray()!;
        gl.bindVertexArray(this.vao);

        this.buffer = BufferUtil.createArrayBuffer(gl, new Float32Array([

            // positions, texcoords
            // top left
            -1, 1, 0, 1,
            // top right
            1, 1, 1, 1,
            // bottom left
            -1, -1, 0, 0,

            // top right
            1, 1, 1, 1,
            // bottom right
            1, -1, 1, 0,
            // bottom left
            -1, -1, 0, 0,
        ]));

        const stride = Float32Array.BYTES_PER_ELEMENT * 4;

        // desribe buffer 
        this.gl.enableVertexAttribArray(0);
        this.gl.vertexAttribPointer(0, 2, gl.FLOAT, false, stride, 0);

        this.gl.enableVertexAttribArray(1);
        this.gl.vertexAttribPointer(1, 2, gl.FLOAT, false, stride, Float32Array.BYTES_PER_ELEMENT * 2);

        this.gl.bindVertexArray(null);
        this.gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }

    public bind() {
        // if we are doing both passes, we need to bind the horizontal framebuffer
        if (this.doHorizontalPass) {
            this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.glHorizontalFramebuffer);
        }
        else if (this.doVerticalPass) {
            this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.glVerticalFramebuffer);
        }
    }

    public draw() {

        if (this.doHorizontalPass) {

            // if we are doing verical pass draw to the vertical framebuffer
            if (this.doVerticalPass) {
                this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.glVerticalFramebuffer);
            }
            else {
                // back to default buffer/texture, which is canvas 
                this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
            }

            this.gl.useProgram(this.glHorizontalPassProgram);
            this.gl.bindVertexArray(this.vao);
            this.gl.bindTexture(this.gl.TEXTURE_2D, this.glHorizontalTexture);
            this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);

        }

        if (this.doVerticalPass) {

            // VERTICAL PASS 
            this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);

            this.gl.useProgram(this.glVerticalPassProgram);
            this.gl.bindVertexArray(this.vao);
            this.gl.bindTexture(this.gl.TEXTURE_2D, this.glVerticalTexture);
            this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
        }

        
        // cleanup 
        this.gl.bindVertexArray(null);
        this.gl.bindTexture(this.gl.TEXTURE_2D, null);
        this.gl.useProgram(null);
    }

}