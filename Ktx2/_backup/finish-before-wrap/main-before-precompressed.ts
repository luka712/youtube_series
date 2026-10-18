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
  const ktexture = new ktxLib.ktxTexture(ktxdata);
  return ktexture;
}

// Step 3: create the WebGL texture.
// Transcode the Basis Universal data to a format the GPU supports,
// then upload it.
function createTexture(gl: WebGL2RenderingContext, ktxLib: any, ktxTexture: any) {

  // Texture compressed formats can be used and checked through extensions.
  const astcExt = gl.getExtension("WEBGL_compressed_texture_astc");
  const bptcExt = gl.getExtension("EXT_texture_compression_bptc");
  const etcExt = gl.getExtension("WEBGL_compressed_texture_etc");
  const s3tcExt = gl.getExtension("WEBGL_compressed_texture_s3tc");

  // Pick the transcode target and the matching WebGL internal format.
  // If none is supported, fall back to uncompressed RGBA.
  let target = ktxLib.TranscodeTarget.RGBA32;
  let internalFormat: number = gl.RGBA8;
  let formatName = "RGBA32 (uncompressed)";
  if (astcExt) {
    target = ktxLib.TranscodeTarget.ASTC_4x4_RGBA;
    internalFormat = astcExt.COMPRESSED_RGBA_ASTC_4x4_KHR;
    formatName = "ASTC 4x4";
  } else if (bptcExt) {
    target = ktxLib.TranscodeTarget.BC7_RGBA;
    internalFormat = bptcExt.COMPRESSED_RGBA_BPTC_UNORM_EXT;
    formatName = "BC7";
  } else if (etcExt) {
    target = ktxLib.TranscodeTarget.ETC2_RGBA;
    internalFormat = etcExt.COMPRESSED_RGBA8_ETC2_EAC;
    formatName = "ETC2";
  } else if (s3tcExt) {
    target = ktxLib.TranscodeTarget.BC3_RGBA;
    internalFormat = s3tcExt.COMPRESSED_RGBA_S3TC_DXT5_EXT;
    formatName = "BC3";
  }

  // UASTC and ETC1S files need transcoding, other KTX2 files are already in a GPU format.
  if (ktxTexture.needsTranscoding) {
    const result = ktxTexture.transcodeBasis(target, 0);
    if (result !== ktxLib.ErrorCode.SUCCESS) throw new Error("Transcoding failed");
  }

  const width = ktxTexture.baseWidth as number;
  const height = ktxTexture.baseHeight as number;

  // Mip level 0, layer 0, face 0. Our file has a single mip level.
  const data = ktxTexture.getImage(0, 0, 0) as Uint8Array;

  const texture = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, texture);
  if (internalFormat === gl.RGBA8) {
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
  } else {
    gl.compressedTexImage2D(gl.TEXTURE_2D, 0, internalFormat, width, height, 0, data);
  }

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  return { texture, width, height, formatName, bytes: data.byteLength };
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
  const tex = createTexture(gl, ktxLib, ktxTexture);

  // Step 4: free the WebAssembly memory.
  ktxTexture.delete();

  // Step 5: display the texture.
  info.textContent = `${tex.width}×${tex.height}, transcoded to ${tex.formatName}, ${(tex.bytes / 1024 / 1024).toFixed(3)} MiB on the GPU`;
  draw(tex.texture, tex.width, tex.height);
}

main(gl).catch((e) => {
  info.textContent = `Error: ${e instanceof Error ? e.message : e}`;
  console.error(e);
});
