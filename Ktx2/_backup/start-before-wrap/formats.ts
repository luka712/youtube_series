// Compressed formats we can transcode Basis Universal data to, best first.
// Each one needs a WebGL extension, and `internalFormat` is the constant
// that the extension adds for gl.compressedTexImage2D.
export interface CompressedFormat {
  name: "ASTC_4x4_RGBA" | "BC7_RGBA" | "ETC2_RGBA" | "BC3_RGBA";
  extension: string;
  internalFormat: number;
}

const formats: CompressedFormat[] = [
  { name: "ASTC_4x4_RGBA", extension: "WEBGL_compressed_texture_astc", internalFormat: 0x93b0 }, // COMPRESSED_RGBA_ASTC_4x4_KHR
  { name: "BC7_RGBA", extension: "EXT_texture_compression_bptc", internalFormat: 0x8e8c }, // COMPRESSED_RGBA_BPTC_UNORM_EXT
  { name: "ETC2_RGBA", extension: "WEBGL_compressed_texture_etc", internalFormat: 0x9278 }, // COMPRESSED_RGBA8_ETC2_EAC
  { name: "BC3_RGBA", extension: "WEBGL_compressed_texture_s3tc", internalFormat: 0x83f3 }, // COMPRESSED_RGBA_S3TC_DXT5_EXT
];

/**
 * Returns the first compressed format the GPU supports, or null when none is,
 * in which case we fall back to uncompressed RGBA.
 * For testing, force one with ?format=BC7_RGBA (or ?format=RGBA32 for the fallback).
 */
export function pickFormat(gl: WebGL2RenderingContext): CompressedFormat | null {
  const forced = new URLSearchParams(location.search).get("format");
  for (const format of formats) {
    if (forced && forced !== format.name) continue;
    // getExtension both checks support and enables the extension.
    if (gl.getExtension(format.extension)) return format;
  }
  return null;
}
