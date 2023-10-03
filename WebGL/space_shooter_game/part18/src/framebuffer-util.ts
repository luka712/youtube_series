
export class FramebufferResult {
    public glFramebuffer!: WebGLFramebuffer;
    public glTexture!: WebGLTexture;
}


export class FramebufferUtil {
    public static createFramebuffer(gl: WebGL2RenderingContext, width: number, height: number) {
        const framebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

        // create empty texture for framebuffer
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB,
            width, height,
            0, gl.RGB, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.bindTexture(gl.TEXTURE_2D, null);

        // attach texture to framebuffer
        gl.framebufferTexture2D(
            gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
            throw new Error("Framebuffer incomplete");
        }

        return {
            glFramebuffer: framebuffer,
            glTexture: texture
        };
    }
}