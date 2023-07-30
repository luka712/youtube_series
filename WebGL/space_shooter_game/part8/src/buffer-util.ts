export class BufferUtil {
    /**
     * Creates a WebGL buffer from given data.
     * @param gl the WebGL context
     * @param data the data to be stored in the buffer
     * @returns the created buffer
     */
    public static createArrayBuffer(gl: WebGL2RenderingContext, data: Float32Array): WebGLBuffer {
        const buffer = gl.createBuffer()!;
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

        return buffer;
    }

    /**
     * Creates a WebGL elementy array buffer from given data.
     * @param gl the WebGL context
     * @param data the data to be stored in the buffer
     * @returns the created buffer
     */
    public static createIndexBuffer(gl: WebGL2RenderingContext, data: Uint8Array | Uint16Array | Uint32Array): WebGLBuffer {

        const buffer = gl.createBuffer()!;
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data, gl.STATIC_DRAW);

        return buffer;
    }
}