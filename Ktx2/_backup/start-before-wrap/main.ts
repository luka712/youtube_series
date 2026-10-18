import { pickFormat } from "./formats";
import { createQuadRenderer } from "./quad";

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const info = document.getElementById("info") as HTMLDivElement;
const gl = canvas.getContext("webgl2");
if (!gl) throw new Error("WebGL2 is not supported");

// Already set up for you:
// - index.html loads libktx_read.js, which defines the global LIBKTX function.
// - public/ holds libktx_read.wasm and kodim23_uastc.ktx2.
// - src/libktx.d.ts has TypeScript types for the parts of libktx we use.
// - src/formats.ts has pickFormat(gl), which returns the best compressed
//   format the GPU supports, or null.
// - src/quad.ts draws a texture on screen.

// Step 1: load the libktx library.
// TODO: call LIBKTX() and return the module.
// async function loadKtxLibrary(): Promise<KtxModule> { }

// Step 2: load the KTX2 file.
// TODO: fetch the file, create a ktx.ktxTexture from its bytes,
// and read the level count from the KTX2 header.
// async function loadKtx2File(ktx: KtxModule, url: string) { }

// Step 3: create the WebGL texture.
// TODO: transcode to the format from pickFormat(gl) and upload every mip level.
// function createTexture(gl: WebGL2RenderingContext, ktx: KtxModule, ktxTexture: KtxTexture, levelCount: number) { }

// A checkerboard placeholder, so the page shows something before the steps are done.
function createPlaceholderTexture(gl: WebGL2RenderingContext) {
  const size = 8;
  const pixels = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const v = (x + y) % 2 === 0 ? 220 : 60;
      pixels.set([v, v, v, 255], (y * size + x) * 4);
    }
  }
  const texture = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, size, size, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  return { texture, width: 768, height: 512 };
}

async function main(gl: WebGL2RenderingContext) {
  const draw = createQuadRenderer(gl);

  // TODO: replace the placeholder with the three steps:
  // const ktx = await loadKtxLibrary();
  // const { ktxTexture, levelCount } = await loadKtx2File(ktx, "/kodim23_uastc.ktx2");
  // const tex = createTexture(gl, ktx, ktxTexture, levelCount);
  // ktxTexture.delete(); // free the WebAssembly memory
  const tex = createPlaceholderTexture(gl);
  void pickFormat; // used in step 3

  info.textContent = "Placeholder texture. Follow the steps in src/main.ts to load the KTX2 file.";
  const render = () => draw(tex.texture, tex.width, tex.height);
  window.addEventListener("resize", render);
  render();
}

main(gl).catch((e) => {
  info.textContent = `Error: ${e instanceof Error ? e.message : e}`;
  console.error(e);
});
