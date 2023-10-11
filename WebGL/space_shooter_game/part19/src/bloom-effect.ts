import { BufferUtil } from "./buffer-util";
import { FramebufferUtil } from "./framebuffer-util";
import { ProgramUtil } from "./program-util";
import vertexShaderSource from "./shaders/postProcessVShader.glsl?raw";
import fragmentShaderSource from "./shaders/postProcessBloomShader.glsl?raw";
import { BlurEffect } from "./blur-effect";
import { BloomBlurEffect } from "./bloom-blur-effect";

export class BloomEffect {

    private glProgram: WebGLProgram;

    private blurEffect: BloomBlurEffect;


    private glFramebuffer: WebGLFramebuffer;
    private glScenePassTextureLocation: WebGLUniformLocation;
    private glScenePassTexture: WebGLTexture;
    private glBrightnessBlurTextureLocation: WebGLUniformLocation;
    private glBrightnessBlurTexture: WebGLTexture;

    private vao: WebGLVertexArrayObject;
    private buffer: WebGLBuffer;

    constructor(private gl: WebGL2RenderingContext,
        private width: number,
        private height: number) {

        const vShader = ProgramUtil.createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
        const fShader = ProgramUtil.createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
        this.glProgram = ProgramUtil.createProgram(gl, vShader, fShader);

        const result = FramebufferUtil.createFramebufferWith2ColorAttachments(gl, width, height);
        this.glFramebuffer = result.glFramebuffer!;
        this.glScenePassTexture = result.glTexture!;
        this.glBrightnessBlurTexture = result.glTexture1!;

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

        this.glScenePassTextureLocation = gl.getUniformLocation(this.glProgram,  "u_texture0")!;
        this.glBrightnessBlurTextureLocation = gl.getUniformLocation(this.glProgram, "u_texture1")!;

        this.blurEffect = new BloomBlurEffect(gl, width, height);
    }

    public bind() {
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.glFramebuffer);
        this.gl.drawBuffers([
            this.gl.COLOR_ATTACHMENT0,
            this.gl.COLOR_ATTACHMENT1
        ]);
    }

    public draw() {

        // blur 
        this.blurEffect.draw(this.glBrightnessBlurTexture);
        this.blurEffect.draw(this.glBrightnessBlurTexture);
        this.blurEffect.draw(this.glBrightnessBlurTexture);
        this.blurEffect.draw(this.glBrightnessBlurTexture);
        this.blurEffect.draw(this.glBrightnessBlurTexture);
        this.blurEffect.draw(this.glBrightnessBlurTexture);
        this.blurEffect.draw(this.glBrightnessBlurTexture);
        this.blurEffect.draw(this.glBrightnessBlurTexture);
        this.blurEffect.draw(this.glBrightnessBlurTexture);
        this.blurEffect.draw(this.glBrightnessBlurTexture);

        // back to default buffer/texture, which is canvas 
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);

        this.gl.useProgram(this.glProgram);

        this.gl.uniform1i(this.glScenePassTextureLocation, 0);
        this.gl.uniform1i(this.glBrightnessBlurTextureLocation, 1);

        this.gl.bindVertexArray(this.vao);

        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.glScenePassTexture);

        this.gl.activeTexture(this.gl.TEXTURE1);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.glBrightnessBlurTexture);

        this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);

        // cleanup 
        this.gl.bindVertexArray(null);
        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, null);
        this.gl.useProgram(null);
    }

}