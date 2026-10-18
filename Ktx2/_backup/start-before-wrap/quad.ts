// Draws a texture on a quad that keeps the image's aspect ratio.
// Nothing KTX2-specific here.

const vertexSource = `#version 300 es
in vec2 aPosition;
uniform vec2 uScale;
out vec2 vUV;
void main() {
  // KTX2 images start at the top-left, so flip V.
  vUV = vec2(aPosition.x * 0.5 + 0.5, 0.5 - aPosition.y * 0.5);
  gl_Position = vec4(aPosition * uScale, 0.0, 1.0);
}`;

const fragmentSource = `#version 300 es
precision mediump float;
in vec2 vUV;
uniform sampler2D uTexture;
out vec4 outColor;
void main() {
  outColor = texture(uTexture, vUV);
}`;

function compile(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) ?? "");
  return shader;
}

export function createQuadRenderer(gl: WebGL2RenderingContext) {
  const program = gl.createProgram()!;
  gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, vertexSource));
  gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, fragmentSource));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) ?? "");

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const aPosition = gl.getAttribLocation(program, "aPosition");
  gl.enableVertexAttribArray(aPosition);
  gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

  const uScale = gl.getUniformLocation(program, "uScale");
  const uTexture = gl.getUniformLocation(program, "uTexture");

  return function draw(texture: WebGLTexture, width: number, height: number) {
    const canvas = gl.canvas as HTMLCanvasElement;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight * dpr;
    gl.viewport(0, 0, canvas.width, canvas.height);

    const imageAspect = width / height;
    const canvasAspect = canvas.width / canvas.height;
    const scale = imageAspect > canvasAspect ? [0.9, (0.9 * canvasAspect) / imageAspect] : [(0.9 * imageAspect) / canvasAspect, 0.9];

    gl.clearColor(0.13, 0.13, 0.13, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);
    gl.uniform2fv(uScale, scale);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(uTexture, 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };
}
