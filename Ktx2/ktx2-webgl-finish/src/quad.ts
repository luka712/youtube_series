// Draws a texture on a quad.
// Nothing KTX2-specific here.

const vertexSource = `#version 300 es
in vec2 aPosition;
in vec2 aTextureCoord;
out vec2 vTextureCoord;
void main() {
  vTextureCoord = aTextureCoord;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

const fragmentSource = `#version 300 es
precision mediump float;
in vec2 vTextureCoord;
uniform sampler2D uTexture;
out vec4 outColor;
void main() {
  outColor = texture(uTexture, vTextureCoord);
}`;

const geometry = {
  vertices: new Float32Array([-0.75, -0.75, 0.75, -0.75, -0.75, 0.75, 0.75, 0.75]),
  textureCoords: new Float32Array([0, 1, 1, 1, 0, 0, 1, 0]), // KTX2 images start at the top-left, so V is flipped
}

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

  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, geometry.vertices, gl.STATIC_DRAW);

const textureCoordBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);
gl.bufferData(gl.ARRAY_BUFFER, geometry.textureCoords, gl.STATIC_DRAW);

  const aPosition = gl.getAttribLocation(program, "aPosition");
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.enableVertexAttribArray(aPosition);
  gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

  const aTextureCoord = gl.getAttribLocation(program, "aTextureCoord");
gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);
gl.enableVertexAttribArray(aTextureCoord);
gl.vertexAttribPointer(aTextureCoord, 2, gl.FLOAT, false, 0, 0);

  const uTexture = gl.getUniformLocation(program, "uTexture");

  return function draw(texture: WebGLTexture) {
    // Make the canvas the size of the texture.
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.clearColor(0.3, 0.6, 0.9, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(uTexture, 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };
}
