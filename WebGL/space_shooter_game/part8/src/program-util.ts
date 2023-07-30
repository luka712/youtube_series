export class ProgramUtil {
    /**
   * Create a WebGL program from given vertex and fragment shader.
   * @param vertexShader vertex shader
   * @param fragmentShader fragment shader 
   * @returns the created program
   */
    public static createProgram(gl: WebGL2RenderingContext, vertexShader: WebGLShader, fragmentShader: WebGLShader): WebGLProgram {
        const program = gl.createProgram()!;
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);

        gl.linkProgram(program);

        const linked = gl.getProgramParameter(program, gl.LINK_STATUS);
        if (!linked) {
            const programError = gl.getProgramInfoLog(program);
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
    public static createShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
        const shader = gl.createShader(type)!;

        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        const compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
        if (!compiled) {
            const shaderError = gl.getShaderInfoLog(shader);
            console.warn("Shader compilation failed: " + shaderError);
        }

        return shader;
    }
}