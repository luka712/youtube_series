import texQuadVShaderSource from './tex-quad-v-shader.glsl?raw';
import texQuadFShaderSource from './tex-quad-f-shader.glsl?raw';
import postProcessVShaderSource from './post-process-v-shader.glsl?raw';
import postProcessFShaderSource from './post-process-f-shader.glsl?raw';
import { mat4 } from 'gl-matrix';

let canvas: HTMLCanvasElement;
let gl: WebGL2RenderingContext;

let quadProgram: WebGLProgram;
let quadVAO: WebGLVertexArrayObject;

// post processing
let postProcessVao: WebGLVertexArrayObject;
let postProcessProgram: WebGLProgram;
let framebuffer: WebGLFramebuffer;
let framebufferTexture: WebGLTexture;

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
    // Create position and texture attributes for material shader
    // each vertex is position(x,y,z) and textureCoords(t,s)
    const data = new Float32Array([
        // x   y   z    t  s    // position and texture coords
        1, 1, 0, 1, 1,   // vertex 1 
        1, -1, 0, 1, 0,   // vertex 2 
        -1, -1, 0, 0, 0,  // vertex 3
        -1, 1, 0, 0, 1   // vertex 4
    ]);
    const iData = new Uint8Array([
        0, 1, 2, // first triangle
        0, 2, 3  // second triangle
    ])
    postProcessVao = createVAO(data, iData);


    // setup program
    postProcessProgram = createWebGLProgram(postProcessVShaderSource, postProcessFShaderSource);

    framebufferSetup();
}



function framebufferSetup()
{
    // POST PROCESS  
    // 1. first we need an empty texture, to which to render the scene.
    framebufferTexture = createTexture(canvas);

    // 2. create framebuffer and add texture to color attachment 0
    framebuffer = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, framebufferTexture, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
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
    const iData = new Uint8Array([
        0, 1, 2, // first triangle
        0, 2, 3  // second triangle
    ])
    quadVAO = createVAO(data, iData);

    // 2. load shader and create program. Get uniforms as well
    quadProgram = createWebGLProgram(texQuadVShaderSource, texQuadFShaderSource);

    // now get uniforms
    materialProjectionMatrixLocation = gl.getUniformLocation(quadProgram, "uProjection")!;
    materialViewMatrixLocation = gl.getUniformLocation(quadProgram, "uView")!;
    materialModelMatrixLocation = gl.getUniformLocation(quadProgram, "uModel")!;

    // 3. load and assign sprite textures
    catTexture = createTexture(document.getElementById("cat-texture") as HTMLImageElement);
    foxTexture = createTexture(document.getElementById("fox-texture") as HTMLImageElement);
    dogTexture = createTexture(document.getElementById("dog-texture") as HTMLImageElement);
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

/**
 * Creates vertex array object with position and tex coords attributes.
 * - position vec3
 * - texCoords vec2 
 * @param data 
 * @returns 
 */
function createVAO(data: Float32Array, indicesData: Uint8Array): WebGLVertexArrayObject 
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
    const indicesBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indicesBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indicesData, gl.STATIC_DRAW);

    // unbind vao 
    gl.bindVertexArray(null);

    return vao;
}

function createTexture(imageOrCanvas: HTMLImageElement | HTMLCanvasElement): WebGLTexture
{
    const texture = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, texture);

    if (imageOrCanvas instanceof HTMLImageElement)
    {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imageOrCanvas as HTMLImageElement);
    }
    else
    {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, imageOrCanvas.width, imageOrCanvas.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    }

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    return texture;
}

function draw()
{
    // draw to texture of framebuffer.
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

    // clear contents of framewbuffer.
    gl.clearColor(clearColor.r, clearColor.g, clearColor.b, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // now scene is drawn into framebuffer texture.
    drawScene();

    // now draw to screen buffer.
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.clearColor(clearColor.r, clearColor.g, clearColor.b, 1);
    gl.bindVertexArray(postProcessVao);
    gl.useProgram(postProcessProgram);
    gl.bindTexture(gl.TEXTURE_2D, framebufferTexture);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_BYTE, 0);

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
    drawQuad(foxTexture, 200, 200);
    drawQuad(dogTexture, 300, 300);
}


setup();

export { }