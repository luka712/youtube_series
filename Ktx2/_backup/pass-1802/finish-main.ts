import { createQuadRenderer } from "./quad";

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
canvas.width = 1280;
canvas.height = 720;
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

// One entry per compressed format, best first.
// `vkFormat` is what an already-encoded KTX2 file reports.
// `target` is what Basis Universal (UASTC or ETC1S) transcodes to.
// Both paths upload with the same WebGL `internalFormat`.
function supportedFormats(gl: WebGL2RenderingContext, ktxLib: any) {
  const astcExt = gl.getExtension("WEBGL_compressed_texture_astc");
  const bptcExt = gl.getExtension("EXT_texture_compression_bptc");
  const etcExt = gl.getExtension("WEBGL_compressed_texture_etc");
  const s3tcExt = gl.getExtension("WEBGL_compressed_texture_s3tc");

  return [
    astcExt && {
      vkFormat: 157, // VK_FORMAT_ASTC_4x4_UNORM_BLOCK
      target: ktxLib.TranscodeTarget.ASTC_4x4_RGBA,
      internalFormat: astcExt.COMPRESSED_RGBA_ASTC_4x4_KHR as number,
      formatName: "ASTC 4x4",
    },
    bptcExt && {
      vkFormat: 145, // VK_FORMAT_BC7_UNORM_BLOCK
      target: ktxLib.TranscodeTarget.BC7_RGBA,
      internalFormat: bptcExt.COMPRESSED_RGBA_BPTC_UNORM_EXT as number,
      formatName: "BC7",
    },
    etcExt && {
      vkFormat: 151, // VK_FORMAT_ETC2_R8G8B8A8_UNORM_BLOCK
      target: ktxLib.TranscodeTarget.ETC2_RGBA,
      internalFormat: etcExt.COMPRESSED_RGBA8_ETC2_EAC as number,
      formatName: "ETC2",
    },
    s3tcExt && {
      vkFormat: 137, // VK_FORMAT_BC3_UNORM_BLOCK
      target: ktxLib.TranscodeTarget.BC3_RGBA,
      internalFormat: s3tcExt.COMPRESSED_RGBA_S3TC_DXT5_EXT as number,
      formatName: "BC3",
    },
  ].filter((format) => !!format);
}

// Step 3: create the WebGL texture.
// Basis Universal data is transcoded to a format the GPU supports first.
// Files already in a GPU format are uploaded as they are.
function createTexture(gl: WebGL2RenderingContext, ktxLib: any, ktxTexture: any): WebGLTexture {

  const width = ktxTexture.baseWidth;
  const height = ktxTexture.baseHeight;
  const vkFormat = ktxTexture.vkFormat;
  let internalFormat: number = gl.RGBA8;

  const astcExt = gl.getExtension("WEBGL_compressed_texture_astc");
  const bptcExt = gl.getExtension("EXT_texture_compression_bptc");
  const s3tcExt = gl.getExtension("WEBGL_compressed_texture_s3tc");
  const etcExt = gl.getExtension("WEBGL_compressed_texture_etc");

  if (ktxTexture.needsTranscoding) {
    let transcodeFormat = ktxLib.TranscodeTarget.RGBA32;
    if (astcExt) {
      transcodeFormat = ktxLib.TranscodeTarget.ASTC_4x4_RGBA;
      internalFormat = astcExt.COMPRESSED_RGBA_ASTC_4x4_KHR;
    } else if (bptcExt) {
      transcodeFormat = ktxLib.TranscodeTarget.BC7_RGBA;
      internalFormat = bptcExt.COMPRESSED_RGBA_BPTC_UNORM_EXT;
    }
    else if (s3tcExt) {
      transcodeFormat = ktxLib.TranscodeTarget.BC3_RGBA;
      internalFormat = s3tcExt.COMPRESSED_RGBA_S3TC_DXT5_EXT;
    }
    else if (etcExt) {
      transcodeFormat = ktxLib.TranscodeTarget.ETC2_RGBA;
      internalFormat = etcExt.COMPRESSED_RGBA8_ETC2_EAC;
    }
    const result = ktxTexture.transcodeBasis(transcodeFormat, 0);
    if (result !== ktxLib.ErrorCode.SUCCESS) {
      throw new Error("Transcoding failed");
    }
  }
  else {
    // VkFormat enums https://docs.vulkan.org/refpages/latest/refpages/source/VkFormat.html
    if (astcExt && vkFormat == 157) {
      internalFormat = astcExt.COMPRESSED_RGBA_ASTC_4x4_KHR;
    } else if (bptcExt && vkFormat == 145) {
      internalFormat = bptcExt.COMPRESSED_RGBA_BPTC_UNORM_EXT;
    }
    else if (s3tcExt && vkFormat == 137) {
      internalFormat = s3tcExt.COMPRESSED_RGBA_S3TC_DXT5_EXT;
    }
    else if (etcExt && vkFormat == 151) {
      internalFormat = etcExt.COMPRESSED_RGBA8_ETC2_EAC;
    }
  }

  const data = ktxTexture.getImage(0, 0, 0);


  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  if (internalFormat == gl.RGBA8) {
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
  } else {
    gl.compressedTexImage2D(gl.TEXTURE_2D, 0, internalFormat, width, height, 0, data);
  }
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  return texture;
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
  // public/ also has files already in a GPU format: kodim23_astc.ktx2, kodim23_bc7.ktx2,
  // kodim23_etc2.ktx2, kodim23_bc3.ktx2 and the uncompressed kodim23_raw.ktx2.
  const ktxTexture = await loadKtx2File(ktxLib, "/kodim23_uastc.ktx2");

  // Step 3: create the WebGL texture.
  const tex = createTexture(gl, ktxLib, ktxTexture);

  // Step 4: free the WebAssembly memory.
  ktxTexture.delete();

  // Step 5: display the texture.
  draw(tex);
}

main(gl).catch((e) => {
  info.textContent = `Error: ${e instanceof Error ? e.message : e}`;
  console.error(e);
});
