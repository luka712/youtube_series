import { BufferUtil } from "./buffer-util";
import { FramebufferUtil } from "./framebuffer-util";
import { ProgramUtil } from "./program-util";
import vertexShaderSource from "./shaders/postProcessVShader.glsl?raw";
import fragmentShaderSource from "./shaders/postProcessBlurHorizontalPass.glsl?raw";
import fragmentShaderSource2 from "./shaders/postProcessBlurVerticalPass.glsl?raw";

export class BloomBlurEffect {

    private glHorizontalPassProgram: WebGLProgram;
    private glVerticalPassProgram: WebGLProgram;

    private glFramebuffer0: WebGLFramebuffer;
    private glFramebuffer1: WebGLFramebuffer;

    private glPingPongTexture: WebGLTexture;

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
        this.glFramebuffer0 = result.glFramebuffer!;
        this.glPingPongTexture = result.glTexture!;

        const result2 = FramebufferUtil.createFramebuffer(gl, width, height);
        this.glFramebuffer1 = result2.glFramebuffer!;

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

    public draw(textureToApplyEffectTo: WebGLTexture) {

        // if we are doing verical pass draw to the vertical framebuffer
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.glFramebuffer1);
        this.gl.framebufferTexture2D(
            this.gl.FRAMEBUFFER,
            this.gl.COLOR_ATTACHMENT0,
            this.gl.TEXTURE_2D,
            this.glPingPongTexture,
            0
        );

        this.gl.useProgram(this.glHorizontalPassProgram);
        this.gl.bindVertexArray(this.vao);
        this.gl.bindTexture(this.gl.TEXTURE_2D, textureToApplyEffectTo);
        this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);


        // VERTICAL PASS 
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.glFramebuffer0);
        this.gl.framebufferTexture2D(
            this.gl.FRAMEBUFFER,
            this.gl.COLOR_ATTACHMENT0,
            this.gl.TEXTURE_2D,
            textureToApplyEffectTo,
            0
        );

        this.gl.useProgram(this.glVerticalPassProgram);
        this.gl.bindVertexArray(this.vao);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.glPingPongTexture);
        this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);

        // cleanup 
        this.gl.bindVertexArray(null);
        this.gl.bindTexture(this.gl.TEXTURE_2D, null);
        this.gl.useProgram(null);
    }

}