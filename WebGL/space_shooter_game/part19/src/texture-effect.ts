import { BufferUtil } from "./buffer-util";
import { FramebufferUtil } from "./framebuffer-util";
import { ProgramUtil } from "./program-util";
import vertexShaderSource from "./shaders/postProcessVShader.glsl?raw";
import fragmentShaderSource from "./shaders/postProcessTextureShader.glsl?raw";
import { Texture } from "./texture";

export class TextureEffect {

    private glProgram: WebGLProgram;

    private glFramebuffer: WebGLFramebuffer;
    private glTexture: WebGLTexture;

    private vao: WebGLVertexArrayObject;
    private buffer: WebGLBuffer;

    // this is texture that will be mixed with scene texture
    private combineTexture?: Texture;

    public mixValue = 0.25;

    private textureUnit0Location: WebGLUniformLocation;
    private textureUnit1Location: WebGLUniformLocation;
    private mixValueLocation: WebGLUniformLocation;

    constructor(private gl: WebGL2RenderingContext,
        private width: number,
        private height: number) {

        const vShader = ProgramUtil.createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
        const fShader = ProgramUtil.createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
        this.glProgram = ProgramUtil.createProgram(gl, vShader, fShader);

        const result = FramebufferUtil.createFramebuffer(gl, width, height);
        this.glFramebuffer = result.glFramebuffer!;
        this.glTexture = result.glTexture!;

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

        this.textureUnit0Location = gl.getUniformLocation(this.glProgram, "u_texture0")!;
        this.textureUnit1Location = gl.getUniformLocation(this.glProgram, "u_texture1")!;
        this.mixValueLocation = gl.getUniformLocation(this.glProgram, "u_mixValue")!;
    }

    public bind() {
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.glFramebuffer);
        this.gl.clearColor(1, 0, 0, 1);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    }

    public setTexture(texture: Texture) {
        this.combineTexture = texture;
    }

    public draw() {
        // back to default buffer/texture, which is canvas 
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);

        this.gl.useProgram(this.glProgram);
        this.gl.bindVertexArray(this.vao);

        // set which texture units to render with
        this.gl.uniform1i(this.textureUnit0Location, 0);
        this.gl.uniform1i(this.textureUnit1Location, 1);

        // set each texture to it's texture unit
        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.glTexture);
        this.gl.activeTexture(this.gl.TEXTURE1);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.combineTexture!.texture);

        this.gl.uniform1f(this.mixValueLocation, this.mixValue);

        this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);

        // cleanup 
        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindVertexArray(null);
        this.gl.bindTexture(this.gl.TEXTURE_2D, null);
        this.gl.useProgram(null);
    }

}