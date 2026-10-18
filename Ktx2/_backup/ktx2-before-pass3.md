---
title: "KTX2: one texture file for every GPU"
slug: ktx2-one-texture-file-for-every-gpu
date: DRAFT
summary: "Why GPU compressed textures matter, how BC4 compression works, what KTX2 and Basis Universal are, and how to load KTX2 in WebGL."
tags: [ktx2, textures, webgl, basis-universal]
---

## GPU compressed formats

Textures are expensive. They are large, and they keep growing as screens get sharper and expectations rise.

When we think about making a texture smaller, we usually think of PNG, JPEG, or WebP. They are great at shrinking the file, but the GPU can't sample them, so they are decoded to raw pixels on the CPU before `texImage2D` uploads them.

So a 4096×4096 RGBA texture takes 64 MB of raw pixels, at 4 bytes per pixel. Compress it to WebP and the file might shrink to a few megabytes, but after decoding it's back to 64 MB, and that is how much GPU memory it uses. You saved on file size, not on video memory, and you paid extra CPU time to decode it.

GPU compressed formats solve this. They store the texture in a form the GPU can sample directly, so it stays compressed in video memory. Most of them split the image into small blocks of pixels, usually 4×4 (more on that later), and encode each block to a fixed number of bytes. For RGBA textures, common formats such as BC7 and ASTC 4×4 use 1 byte per pixel, a 4:1 ratio, so the 64 MB texture takes 16 MB on the GPU. Other formats trade quality for size. In this post I will mainly stick to the more popular formats that compress 4×4 blocks.

![A 4096×4096 RGBA texture: as WebP it is decoded on the CPU and takes 64 MB of GPU memory; as a GPU compressed KTX2 texture it is uploaded as is and takes 16 MB](/blog/texture-memory.png)

GPU compressed textures are usually shipped in a container file that also stores the size, the format, and the mipmap levels. Common choices are KTX and KTX2 from Khronos, and DDS from Microsoft. This post focuses on KTX2.

## How does GPU compression work

Let's look at one of the simplest formats, BC4. It stores a single channel, like a grayscale image, a height map, or a roughness map, which takes 1 byte per pixel uncompressed. BC4 halves that, a 2:1 compression ratio.

BC4 splits the image into 4×4 blocks and compresses each block on its own. A block is 16 bytes uncompressed, and BC4 stores it in 8:

- **Two endpoints**, 1 byte each, usually the brightest and darkest pixel in the block.
- **Sixteen indices**, 3 bits each (6 bytes), one per pixel.

From the two endpoints the GPU builds a palette of 8 values: the endpoints themselves plus 6 values evenly spaced between them. Each pixel's index picks one of those 8 values.

![BC4 compression of one 4×4 block: the original values, the palette built from two endpoints, the 3-bit indices, and the decoded block](/blog/bc4-block.png)

| Row | Original | Index | Decoded | Error |
| --- | --- | --- | --- | --- |
| 1 | 161, 184, 203, 218 | 1, 6, 5, 4 | 161, 188, 201, 215 | 0, 4, 2, 3 |
| 2 | 180, 206, 229, 245 | 7, 5, 3, 2 | 174, 201, 228, 242 | 6, 5, 1, 3 |
| 3 | 195, 225, 250, 255 | 5, 3, 0, 0 | 201, 228, 255, 255 | 6, 3, 5, 0 |
| 4 | 206, 237, 255, 255 | 5, 2, 0, 0 | 201, 242, 255, 255 | 5, 5, 0, 0 |

In this block the endpoints are 255 and 161. No pixel is off by more than 6 out of 255, and the block takes half the space.

Here is the same idea applied to a whole height map. Smooth terrain like this is where BC4 shines: the 256×256 map shrinks from 64 KB to 32 KB, and the average error is about a fifth of one step out of 255.

![A 256×256 height map, its BC4 compressed version, and the difference between them, with a zoomed area below each](/blog/heightmap-bc4.png)

BC4 also has a second mode, used when the first endpoint is the smaller one. It keeps 4 values between the endpoints and adds pure black (0) and pure white (255), which helps blocks that mix hard extremes with a gradient.

Because every block is the same size, the GPU can find any block with simple arithmetic and decode it in hardware while sampling. That is why the texture can stay compressed in video memory. The cost is precision: a block can only show 8 distinct values, so fine detail inside a block gets rounded. BC1, BC7, and ASTC build on the same idea, with more channels and smarter palettes.

Now that we roughly know how GPU compressed formats work, let's look at KTX2 and how to turn a PNG into something the GPU can use.

## What KTX2 is

KTX2 is Khronos' container format for GPU textures and the successor to KTX. Its pixel format is a Vulkan `VkFormat`, and alongside the data it stores a full mip chain, array layers, cube map faces, depth slices for 3D textures, a data format descriptor that says how the bytes are laid out, and key/value metadata. One file format covers 2D textures, cube maps, and arrays.

KTX2 can hold any GPU format. Here are the common block compressed ones:

| Format | Channels | Bits per pixel | Typical use | Usually found on |
| --- | --- | --- | --- | --- |
| BC1 | RGB, 1-bit alpha | 4 | Color maps without smooth transparency | Desktop GPUs |
| BC3 | RGBA | 8 | Color with smooth alpha | Desktop GPUs |
| BC4 | R | 4 | Height, roughness, masks | Desktop GPUs |
| BC5 | RG | 8 | Normal maps | Desktop GPUs |
| BC6H | RGB, HDR | 8 | HDR skyboxes and light maps | Desktop GPUs |
| BC7 | RGB or RGBA | 8 | High-quality color, with or without alpha | Desktop GPUs |
| ETC1 | RGB | 4 | Color on older mobile devices | Mobile GPUs |
| ETC2 | RGB or RGBA | 4 (RGB), 8 (RGBA) | Color on mobile | Mobile GPUs, required by OpenGL ES 3.0 |
| EAC | R or RG | 4 (R), 8 (RG) | Single- and two-channel data on mobile | Mobile GPUs |
| ASTC | 1 to 4, LDR or HDR | 8 (4×4 blocks) down to 0.89 (12×12 blocks) | Anything, with a chosen size and quality | Modern mobile GPUs, Apple devices |

The last column is a rule of thumb, not a guarantee. Support depends on the GPU, the driver, and the API, and the lines blur. Apple silicon Macs support both BC and ASTC, some desktop GPUs have supported ASTC, and some mobile chips support BC. In WebGL you check extensions such as `WEBGL_compressed_texture_s3tc` or `WEBGL_compressed_texture_astc`. Newer APIs use features instead: WebGPU has optional features like `texture-compression-bc`, `texture-compression-etc2`, and `texture-compression-astc`, and Vulkan has matching device features plus per-format properties. The safe approach is to check at runtime and pick a format the device actually supports. That gets hard when you don't know what hardware your users will have, and later in the post we'll look at a WebGL example and at how to deal with it.

For comparison, an uncompressed RGBA8 texture is 32 bits per pixel. ASTC is the odd one out: every block is 16 bytes, but the block can cover anything from 4×4 to 12×12 pixels, so you choose the trade between size and quality per texture. Where these names come from is explained in the [appendix on format names](#appendix-where-the-format-names-come-from).

## Creating a KTX2 file

To create a block compressed texture, you can use any texture tool that exports KTX2. Or you can use Khronos' own [KTX-Software](https://github.com/KhronosGroup/KTX-Software), which includes the `ktx` [command-line tool](https://github.khronos.org/KTX-Software/ktxtools/index.html) and the [libktx library](https://github.khronos.org/KTX-Software/libktx/index.html). If you want to follow along, you can download it from the [KTX-Software releases page](https://github.com/KhronosGroup/KTX-Software/releases).

Let's start by converting an image to KTX2 without any texture compression, so we have a baseline. I'm using [Kodak image 23](https://r0k.us/graphics/kodak/kodim23.html). To look inside the resulting file, you can open it in the [KTX2 Viewer](https://ktx2viewer.com/).

![Kodak test image 23: two brightly colored macaws in front of out-of-focus greenery](/blog/kodim23.png)

Create the baseline file:

```sh
ktx create kodim23.png kodim23_raw.ktx2 --format R8G8B8A8_UNORM --assign-tf KHR_DF_TRANSFER_LINEAR
```

The two options:

- `--format R8G8B8A8_UNORM` is Vulkan's `VK_FORMAT_R8G8B8A8_UNORM` without the prefix. The PNG has no alpha, so alpha is filled as opaque.
- `--assign-tf KHR_DF_TRANSFER_LINEAR` labels the data as linear without touching the pixels. The PNG is sRGB, and without this flag `ktx` would convert it to linear, which is lossy.

For a color texture you would normally pick `R8G8B8A8_SRGB` so the GPU decodes sRGB when sampling. Here we keep the bytes untouched so the results are easy to compare.

Open `kodim23_raw.ktx2` in the viewer and it reports 1.5 MiB of GPU memory, which is 768 × 512 pixels × 4 bytes. The file itself is 1,573,120 bytes, almost three times bigger than the 557,596-byte PNG. Uncompressed KTX2 saves nothing on disk, but what is in the file is exactly what goes to the GPU.

Now let's convert the same image to ASTC 4×4:

```sh
ktx create kodim23.png kodim23_astc.ktx2 --format ASTC_4x4_UNORM_BLOCK --assign-tf KHR_DF_TRANSFER_LINEAR
```

With an ASTC format, `ktx` runs the ASTC encoder for you, so `--format` is all it needs. You can tune the encoder with `--astc-quality`, from `fastest` to `exhaustive`. (Older versions of the tool needed `--encode astc` as well. Version 5 rejects it.)

The viewer now reports 0.375 MiB of GPU memory, a quarter of the uncompressed size: 192 × 128 blocks of 16 bytes each. The file shrinks to 393,424 bytes, smaller than the PNG.

If the viewer can't display this file, your GPU probably doesn't support ASTC, which is common on Windows and Linux desktops. That is the problem from earlier: no single block format works everywhere. The fix is to encode the texture once to a universal format, which can be transcoded at load time to whatever format the GPU supports. One such format is UASTC:

```sh
ktx create kodim23.png kodim23_uastc.ktx2 --format R8G8B8A8_UNORM --assign-tf KHR_DF_TRANSFER_LINEAR --encode uastc
```

With `--encode`, `--format` describes the input pixels before encoding, and `--encode uastc` picks the Basis Universal UASTC codec. The file is 393,424 bytes, the same as ASTC 4×4, because UASTC also stores 16 bytes per 4×4 block. Adding `--zstd 18` supercompresses the data with Zstandard and brings it down to 372,727 bytes.

Open it in the viewer and the Texture Format list now offers several GPU formats, because the viewer transcodes UASTC into whichever ones your GPU supports.

![The KTX2 Viewer showing kodim23_uastc.ktx2. The Texture Format list offers RGBA_8_UNORM, BC7_RGBA_UNORM, ASTC_4X4_RGBA, BC3_RGBA_UNORM, and ETC2_RGBA8_UNORM, and with BC7 selected the texture uses 0.375 MiB of GPU memory](/blog/texture_formats_screenshot.png)

On my machine the same file can become BC7, ASTC 4×4, BC3, or ETC2, or be decoded to plain RGBA8 as a fallback. With BC7 selected, it uses 0.375 MiB of GPU memory, the same as the ASTC file, from a single file that works on any GPU.

Before we get to the WebGL example, let's look at how this universal encoding works.

## Basis Universal: encode once, transcode anywhere

Without a universal format, you would ship each texture several times, for example as BC7 for desktops, ASTC for Apple and modern Android, and ETC2 for older mobile devices, and pick one at runtime.

[Basis Universal](https://github.com/BinomialLLC/basis_universal) avoids that. You encode the texture once, and at load time a small transcoder (WebAssembly in the browser) converts it to a format the GPU supports. It converts blocks to blocks, without decoding to pixels, so it's fast, and the texture still stays compressed in video memory. KTX2 stores Basis Universal data directly, which is what `--encode` produced above.

![A KTX2 file with ETC1S or UASTC data goes through the Basis Universal transcoder at load time, which outputs BC7, BC3, or BC1 for desktop GPUs, ASTC 4×4 for Apple and modern Android, ETC2 or ETC1 for older mobile devices, or uncompressed RGBA8 as a fallback](/blog/basis-transcode.png)

There are two modes to choose from:

| | ETC1S | UASTC |
| --- | --- | --- |
| `ktx` option | `--encode basis-lz` | `--encode uastc` |
| Quality | Lower | Higher |
| `kodim23` file size | 53,495 bytes | 393,424 bytes, 279,997 with `--uastc-rdo --zstd 18` |
| Good for | Color maps where download size matters | Normal maps and detailed textures |

It's a trade between quality and size. ETC1S gives much smaller files but loses more detail. UASTC keeps far more detail but the file is about seven times bigger. With `--uastc-rdo` and `--zstd` you can make it smaller, giving up a little quality.

Common transcode targets:

| Target | Bits per pixel | Typically used on |
| --- | --- | --- |
| BC7 | 8 | Desktop GPUs |
| BC3 | 8 | Older desktop GPUs without BC7 |
| BC1 | 4 | Desktop GPUs, no alpha |
| ASTC 4×4 | 8 | Apple devices and most current Android GPUs |
| ETC2 RGBA | 8 | Older mobile GPUs without ASTC |
| ETC1 | 4 | Very old mobile GPUs, no alpha |
| RGBA8 | 32 | Fallback when nothing else is supported |

GPU memory depends on the target, not on the file. The 53 KB ETC1S file still takes 0.375 MiB as BC7. ETC1S saves download size, and both save video memory.

## Using KTX2 with WebGL

For the example I decided to use raw WebGL 2, so no engine gets in the way. You can follow along with the [starting project](https://github.com/luka712/youtube_series/tree/main/Ktx2/ktx2-webgl-start), and the [finished project](https://github.com/luka712/youtube_series/tree/main/Ktx2/ktx2-webgl-finish) has the full code. Both already draw a textured quad, and each project's `public/` folder has kodim23 in every format from this post: `kodim23_raw.ktx2`, `kodim23_astc.ktx2`, `kodim23_bc7.ktx2`, `kodim23_etc2.ktx2`, `kodim23_bc3.ktx2` and `kodim23_uastc.ktx2`.

### Loading the library

First we need a library that reads KTX2, and Khronos provides one: [libktx for JavaScript](https://github.khronos.org/KTX-Software/ktxjswrappers/libktx_js.html). Builds are attached to the [KTX-Software releases](https://github.com/KhronosGroup/KTX-Software/releases). I took the liberty of adding them to both projects, so you don't need to download anything. All you need is `libktx_read.js` and `libktx_read.wasm` from the `Web-libktx_read` zip.

`index.html` loads `libktx_read.js`, which defines a global `LIBKTX` function. Calling it downloads and compiles the WebAssembly module. I use `// @ts-ignore` in a couple of places because the library doesn't ship TypeScript definitions. We could write them, but for simplicity I'm just using the raw API.

```typescript
// @ts-ignore
const ktxLib = await LIBKTX();
```

### Loading the KTX2 file

Next we load the file itself. We fetch its bytes and let libktx parse them:

```typescript
async function loadKtx2File(ktxLib: any, url: string) {
  const response = await fetch(url);
  const ktxdata = new Uint8Array(await response.arrayBuffer());
  const ktexture = new ktxLib.ktxTexture(ktxdata);
  return ktexture;
}
```

This gives us an object with several properties. The ones we care about are:

- `baseWidth` and `baseHeight`, the size of the top mip level.
- `vkFormat`, the pixel format. KTX2 uses Vulkan format numbers, for example `37` for `VK_FORMAT_R8G8B8A8_UNORM` or `157` for `VK_FORMAT_ASTC_4x4_UNORM_BLOCK`.
- `needsTranscoding`, which is `true` for Basis Universal files (UASTC and ETC1S).

libktx doesn't export names for the Vulkan formats, so we define the ones we need:

```typescript
const VK_FORMAT_R8G8B8A8_UNORM = 37;
const VK_FORMAT_BC7_UNORM_BLOCK = 145;
const VK_FORMAT_ASTC_4x4_UNORM_BLOCK = 157;
```

The pixel data comes from `getImage(level, layer, face)`. Our files have a single mip level, so it's always `getImage(0, 0, 0)`.

### Uncompressed textures

Let's see it in action with the uncompressed file, where `vkFormat` is `VK_FORMAT_R8G8B8A8_UNORM`. That is plain RGBA8, so the upload is the same `texImage2D` call you would use for a PNG:

```typescript
const ktxTexture = await loadKtx2File(ktxLib, "/kodim23_raw.ktx2");

const width = ktxTexture.baseWidth;
const height = ktxTexture.baseHeight;
const data = ktxTexture.getImage(0, 0, 0);

const texture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, texture);
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

ktxTexture.delete();
```

Don't forget `delete()`. The texture object is not garbage collected, because its memory belongs to the WebAssembly module.

### Compressed textures

For a file that's already compressed, such as `kodim23_bc7.ktx2`, we check `vkFormat` and select the matching WebGL format. In WebGL every compressed format comes from an extension, and `getExtension` returns `null` when the GPU doesn't support it. Other APIs, such as Vulkan and WebGPU, have you query device features instead.

Let's look at an example with the typical RGBA formats BC7 and ASTC 4×4. I recommend adding at least BC3 and ETC2 as well, as the finished project does.

```typescript
const ktxTexture = await loadKtx2File(ktxLib, "/kodim23_bc7.ktx2");

const width = ktxTexture.baseWidth;
const height = ktxTexture.baseHeight;
const vkFormat = ktxTexture.vkFormat;
let internalFormat: number = gl.RGBA8;

const astcExt = gl.getExtension("WEBGL_compressed_texture_astc");
const bptcExt = gl.getExtension("EXT_texture_compression_bptc");

// VkFormat enums https://docs.vulkan.org/refpages/latest/refpages/source/VkFormat.html
if (astcExt && vkFormat == 157) {
    internalFormat = astcExt.COMPRESSED_RGBA_ASTC_4x4_KHR;
} else if (bptcExt && vkFormat == 145) {
    internalFormat = bptcExt.COMPRESSED_RGBA_BPTC_UNORM_EXT;
}

const data = ktxTexture.getImage(0, 0, 0);

const texture = gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D, texture);
if(internalFormat == gl.RGBA8) {
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
} else {
    gl.compressedTexImage2D(gl.TEXTURE_2D, 0, internalFormat, width, height, 0, data);
}
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

ktxTexture.delete();
```

Once we have the format, `compressedTexImage2D` uploads the compressed blocks exactly as they are in the file. The BC7 texture takes 0.375 MiB of GPU memory, a quarter of the 1.5 MiB uncompressed one.

This is where it gets inconvenient. If the GPU doesn't support the format, there is nothing we can do with the file. Try `kodim23_bc7.ktx2` on a phone and you get the error. Or your desktop GPU might not support astc. You would have to ship one file per format and pick the right one yourself.

### Transcoding Basis Universal

Basis Universal fixes that. When `needsTranscoding` is `true`, we first check which formats the GPU supports, pick the best one, and ask libktx to transcode into it:

```typescript
 const width = ktxTexture.baseWidth;
const height = ktxTexture.baseHeight;
const vkFormat = ktxTexture.vkFormat;
let internalFormat: number = gl.RGBA8;

const astcExt = gl.getExtension("WEBGL_compressed_texture_astc");
const bptcExt = gl.getExtension("EXT_texture_compression_bptc");

// We check if transcoding is required.
if (ktxTexture.needsTranscoding) {
    let transcodeFormat = ktxLib.TranscodeTarget.RGBA32;
    if (astcExt) {
        transcodeFormat = ktxLib.TranscodeTarget.ASTC_4x4_RGBA;
        internalFormat = astcExt.COMPRESSED_RGBA_ASTC_4x4_KHR;
    } else if (bptcExt) {
        transcodeFormat = ktxLib.TranscodeTarget.BC7_RGBA;
        internalFormat = bptcExt.COMPRESSED_RGBA_BPTC_UNORM_EXT;
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
}
```

## Appendix: where the format names come from

BC1 to BC3 started out as S3TC, a scheme by S3 Graphics in the late 1990s. Microsoft licensed it for DirectX 6 under the names DXT1 to DXT5, and you will still see those names in tools and DDS files. Direct3D 10 renamed them to "block compression" BC1 to BC3 and added BC4 and BC5, which grew out of ATI's 3Dc format for normal maps. Direct3D 11 then added BC6H for HDR and BC7 for high-quality color. On the mobile side, ETC stands for Ericsson Texture Compression, developed by Ericsson Research. ETC1 became part of OpenGL ES, and ETC2 together with EAC (Ericsson Alpha Compression) became mandatory in OpenGL ES 3.0. ASTC, Adaptive Scalable Texture Compression, was designed by ARM and adopted by Khronos in 2012 as a single flexible format meant to cover what the others do separately.
