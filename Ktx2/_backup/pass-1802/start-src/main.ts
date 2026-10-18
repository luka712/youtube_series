import { createQuadRenderer } from "./quad";

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const info = document.getElementById("info") as HTMLDivElement;
const gl = canvas.getContext("webgl2");
if (!gl) throw new Error("WebGL2 is not supported");

// Step 2: load the KTX2 file.
// Fetch the bytes and let libktx parse them into a texture object.
async function loadKtx2File(ktxLib: any, url: string) {
  // TODO
}

// Step 3: create the WebGL texture.
// Transcode the Basis Universal data to a format the GPU supports,
// then upload it.
function createTexture(gl: WebGL2RenderingContext, ktxLib: any, ktxTexture: any) {
  // TODO
}

async function main(gl: WebGL2RenderingContext) {
  const draw = createQuadRenderer(gl);

  // Step 1: load the libktx library.
  // libktx_read.js (added in index.html) defines the global LIBKTX function.
  // TODO

  // Step 2: load the KTX2 file.
  // TODO

  // Step 3: create the WebGL texture.
  // TODO

  // Step 4: free the WebAssembly memory.
  // TODO

  // Step 5: display the texture.
  // TODO: draw(texture, width, height);
  info.textContent = "Follow the steps in src/main.ts";
}

main(gl).catch((e) => {
  info.textContent = `Error: ${e instanceof Error ? e.message : e}`;
  console.error(e);
});
