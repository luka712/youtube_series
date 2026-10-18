import { pickFormat } from "./formats";
import { createQuadRenderer } from "./quad";

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const info = document.getElementById("info") as HTMLDivElement;
const gl = canvas.getContext("webgl2");
if (!gl) throw new Error("WebGL2 is not supported");



// Step 2: load the KTX2 file.
// Fetch the bytes and let libktx parse them into a texture object.
async function loadKtx2File(ktxLib: any, url: string) {
  const response = await fetch(url);
  const ktxdata = new Uint8Array(await response.arrayBuffer());
  // @ts-ignore.
  const ktexture = new ktxLib.ktxTexture(ktxdata);
  return ktexture;
}

// Step 3: create the WebGL texture.
// Transcode the Basis Universal data to a format the GPU supports,
// then upload every mip level.
function createTexture(gl: WebGL2RenderingContext, ktxTexture: any) {
  
  // Texture compressed formats can be used and checkec through extensions.
  const astcExt = gl.getExtension("EXT_texture_compression_astc");
  const astcSupport = astcExt ? true : false;
  const bctcExt = gl.getExtension("EXT_texture_compression_bptc");
  const bc7Support = bctcExt ? true : false;


  const texture = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, texture);

  const width = ktxTexture.baseWidth as number;
  const height = ktxTexture.baseHeight as number;
      const format = ktxTexture.format as any;



  const texture = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, texture);

  let width = ktxTexture.baseWidth;
  let height = ktxTexture.baseHeight;
  let bytes = 0;
  for (let level = 0; level < levelCount; level++) {
    const data = ktxTexture.getImage(level, 0, 0);
    bytes += data.byteLength;
    if (format) {
      gl.compressedTexImage2D(gl.TEXTURE_2D, level, format.internalFormat, width, height, 0, data);
    } else {
      gl.texImage2D(gl.TEXTURE_2D, level, gl.RGBA8, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
    }
    width = Math.max(1, width >> 1);
    height = Math.max(1, height >> 1);
  }

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, levelCount > 1 ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  return {
    texture,
    width: ktxTexture.baseWidth,
    height: ktxTexture.baseHeight,
    formatName: format ? format.name : "RGBA32 (uncompressed)",
    bytes,
  };
}

async function main(gl: WebGL2RenderingContext) {
  const draw = createQuadRenderer(gl);

  // Step 1: load the libktx library.
  // libktx_read.js (added in index.html) defines the global LIBKTX function.
  // Calling it downloads and compiles libktx_read.wasm
  //@ts-ignore.
  const ktxLib = await LIBKTX();

  // Step 2: load the KTX2 file.
  // This create a WebAssembly texture object that we can use to create a WebGL texture.
  const ktxTexture = await loadKtx2File(ktxLib, "/kodim23_uastc.ktx2");

  // Step 3: create the WebGL texture.
  const tex = createTexture(gl, ktxTexture);

  // Step 4: free the WebAssembly memory.
  ktxTexture.delete();

  // Step 5: display the texture. 
  info.textContent = `${tex.width}×${tex.height}, transcoded to ${tex.formatName}, ${(tex.bytes / 1024 / 1024).toFixed(3)} MiB on the GPU`;
  const render = () => draw(tex.texture, tex.width, tex.height);
  window.addEventListener("resize", render);
  render();  
}

main(gl).catch((e) => {
  info.textContent = `Error: ${e instanceof Error ? e.message : e}`;
  console.error(e);
});
