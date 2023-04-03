import texQuadVShaderSource from './tex-quad-v-shader.glsl?raw';
import texQuadFShaderSource from './tex-quad-f-shader.glsl?raw';
import { mat4 } from 'gl-matrix';

let canvas: HTMLCanvasElement;
let gl: WebGL2RenderingContext;

let quadProgram: WebGLProgram;
let quadVAO: WebGLVertexArrayObject;

let materialProjectionMatrixLocation: WebGLUniformLocation;
let materialViewMatrixLocation: WebGLUniformLocation;
let materialModelMatrixLocation: WebGLUniformLocation;

let foxTexture: WebGLTexture;
let catTexture: WebGLTexture;
let dogTexture: WebGLTexture;

// pink 
const clearColor = { r: 1, g: 0.71, b: 0.76 }

function setup()
{
    canvas = document.getElementById("canvas") as HTMLCanvasElement;
    gl = canvas.getContext("webgl2") as WebGL2RenderingContext;

    quadSetup();
    postProcessSetup();


    // transparency
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    draw();
}

function postProcessSetup()
{
    // TODO:
}

function quadSetup()
{
    // SPRITE SETUP
    // 1. load vertex and index data
    // Create position and texture attributes for material shader
    // each vertex is position(x,y,z) and textureCoords(t,s)
    const data = new Float32Array([
        // x   y   z    t  s    // position and texture coords
        0.5, 0.5, 0, 1, 1,   // vertex 1 
        0.5, -0.5, 0, 1, 0,   // vertex 2 
        -0.5, -0.5, 0, 0, 0,  // vertex 3
        -0.5, 0.5, 0, 0, 1   // vertex 4
    ])
    quadVAO = createQuadVAO(data);

    // 2. load shader and create program. Get uniforms as well
    quadProgram = createWebGLProgram(texQuadVShaderSource, texQuadFShaderSource);

    // now get uniforms
    materialProjectionMatrixLocation = gl.getUniformLocation(quadProgram, "uProjection")!;
    materialViewMatrixLocation = gl.getUniformLocation(quadProgram, "uView")!;
    materialModelMatrixLocation = gl.getUniformLocation(quadProgram, "uModel")!;

    // 3. load and assign sprite textures
    catTexture = createQuadTexture("cat-texture");
    foxTexture = createQuadTexture("fox-texture");
    dogTexture = createQuadTexture("dog-texture");
}

function createWebGLProgram(vertexSource: string, fragmentSource: string): WebGLProgram 
{
    // create vertex shader.
    const vertexShader = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(vertexShader, vertexSource);
    gl.compileShader(vertexShader);
    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS))
    {
        const log = gl.getShaderInfoLog(vertexShader);
        console.error(`Failed to compile vertex shader: ${log}`);
    }

    // create fragment shader.
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(fragmentShader, fragmentSource);
    gl.compileShader(fragmentShader);
    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS))
    {
        const log = gl.getShaderInfoLog(fragmentShader);
        console.error(`Failed to compile fragment shader: ${log}`);
    }

    // create program
    const program = gl.createProgram()!;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS))
    {
        const log = gl.getProgramInfoLog(program);
        console.error(`Failed to link program: ${log}`);
    }

    return program;
}

function createQuadVAO(data: Float32Array): WebGLVertexArrayObject 
{
    // vao 
    const vao = gl.createVertexArray()!;
    gl.bindVertexArray(vao);

    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

    // position vec3 * sizeof(float) + texureCoods vec2 * sizeof(float) 
    const stride = 3 * Float32Array.BYTES_PER_ELEMENT + 2 * Float32Array.BYTES_PER_ELEMENT;

    // describe attribute aPosition 
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, stride, 0);
    gl.enableVertexAttribArray(0);

    // describe attribute aTexCoords
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, stride, 3 * Float32Array.BYTES_PER_ELEMENT);
    gl.enableVertexAttribArray(1);

    // create index buffer 
    const indicesData = new Uint8Array([
        0, 1, 2, // first triangle
        0, 2, 3  // second triangle
    ])
    const indicesBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indicesBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indicesData, gl.STATIC_DRAW);

    // unbind vao 
    gl.bindVertexArray(null);

    return vao;
}

function createQuadTexture(elementId: string): WebGLTexture
{
    const texture = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    const img = document.getElementById(elementId) as HTMLImageElement;
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    // use neareast neighbour filter, for pixel perect art.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    return texture;
}

function draw()
{

    gl.clearColor(clearColor.r, clearColor.g, clearColor.b, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    drawScene();

    requestAnimationFrame(draw);
}

function drawQuad(texture: WebGLTexture, posX: number, posY: number)
{
    let model = mat4.create();
    mat4.translate(model, model, [posX, posY, 0]);
    mat4.scale(model, model, [128, 128, 0]);
    gl.uniformMatrix4fv(materialModelMatrixLocation, false, model);

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_BYTE, 0);
}

function drawScene()
{
    // use sprite program and bind sprite data
    gl.useProgram(quadProgram);
    gl.bindVertexArray(quadVAO);

    // create and setup projection matrix
    const projection = mat4.create();
    mat4.ortho(projection, 0, canvas.width, canvas.height, 0, 0.1, 100);
    gl.uniformMatrix4fv(materialProjectionMatrixLocation, false, projection);

    // create and setup view matrix
    const view = mat4.create();
    // 1 in z axis [0,0,1], looks at center [0,0,0] ,  y is up [0,1,0]
    mat4.lookAt(view, [0, 0, 1], [0, 0, 0], [0, 1, 0]);
    gl.uniformMatrix4fv(materialViewMatrixLocation, false, view);

    // draw sprites
    drawQuad(catTexture, 100, 100);
    drawQuad(foxTexture, 110, 100);
    drawQuad(dogTexture, 120, 100);
}


setup();

export { }