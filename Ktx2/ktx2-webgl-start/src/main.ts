import { createQuadRenderer } from "./quad";

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
canvas.width = 1280;
canvas.height = 720;
const gl = canvas.getContext("webgl2");
if (!gl) throw new Error("WebGL2 is not supported");

// Step 2: load the KTX2 file.
// Fetch the bytes and let libktx parse them into a texture object.
async function loadKtx2File(ktxLib: any, url: string) {
  // TODO: fetch the file, wrap the bytes in a Uint8Array
  // and return new ktxLib.ktxTexture(...).
}

// Step 3: create the WebGL texture.
// Basis Universal data is transcoded to a format the GPU supports first.
// Files already in a GPU format are uploaded as they are.
function createTexture(gl: WebGL2RenderingContext, ktxLib: any, ktxTexture: any) {
  // The properties we need from libktx.
  const width = ktxTexture.baseWidth;
  const height = ktxTexture.baseHeight;
  const vkFormat = ktxTexture.vkFormat;
  let internalFormat: number = gl.RGBA8;

  // Compressed formats come from WebGL extensions, null when not supported.
  const astcExt = gl.getExtension("WEBGL_compressed_texture_astc");
  const bptcExt = gl.getExtension("EXT_texture_compression_bptc");
  const s3tcExt = gl.getExtension("WEBGL_compressed_texture_s3tc");
  const etcExt = gl.getExtension("WEBGL_compressed_texture_etc");

  if (ktxTexture.needsTranscoding) {
    // TODO (Transcoding Basis Universal): pick a ktxLib.TranscodeTarget and the
    // matching internalFormat (ASTC 4x4, BC7, BC3, ETC2, else RGBA32),
    // then call ktxTexture.transcodeBasis(target, 0) and check for ktxLib.ErrorCode.SUCCESS.
  } else {
    // TODO (Compressed textures): map vkFormat to internalFormat.
    // VkFormat enums https://docs.vulkan.org/refpages/latest/refpages/source/VkFormat.html
    // 157 ASTC 4x4, 145 BC7, 137 BC3, 151 ETC2. 37 is uncompressed RGBA8.
    // Throw an error if the GPU doesn't support the file's format.
  }

  // TODO (Uncompressed textures): get the pixel data with ktxTexture.getImage(0, 0, 0),
  // create and bind a texture, upload it with texImage2D for RGBA8
  // or compressedTexImage2D for compressed formats, and set the filters.

  return null;
}

async function main(gl: WebGL2RenderingContext) {
  const draw = createQuadRenderer(gl);

  // Step 1: load the libktx library.
  // libktx_read.js (added in index.html) defines the global LIBKTX function.
  // TODO: const ktxLib = await LIBKTX();

  // Step 2: load the KTX2 file.
  // Start with /kodim23_raw.ktx2, then try kodim23_astc.ktx2, kodim23_bc7.ktx2,
  // kodim23_etc2.ktx2, kodim23_bc3.ktx2 and finally kodim23_uastc.ktx2.
  // TODO: const ktxTexture = await loadKtx2File(ktxLib, "/kodim23_raw.ktx2");

  // Step 3: create the WebGL texture.
  // TODO: const tex = createTexture(gl, ktxLib, ktxTexture);

  // Step 4: free the WebAssembly memory.
  // TODO: ktxTexture.delete();

  // Step 5: display the texture.
  // TODO: draw(tex);
  // Until then, just clear the canvas so you can see it.
  gl.clearColor(0.3, 0.6, 0.9, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);
}

main(gl).catch((e) => console.error(e));
