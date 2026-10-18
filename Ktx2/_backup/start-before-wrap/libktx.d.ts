// Minimal typings for the parts of Khronos libktx.js used in this example.
interface KtxTexture {
  readonly baseWidth: number;
  readonly baseHeight: number;
  readonly needsTranscoding: boolean;
  transcodeBasis(target: unknown, flags: number): unknown;
  getImage(level: number, layer: number, faceSlice: number): Uint8Array;
  delete(): void;
}

interface KtxModule {
  ktxTexture: new (data: Uint8Array) => KtxTexture;
  ErrorCode: { SUCCESS: unknown };
  TranscodeTarget: Record<"BC7_RGBA" | "ASTC_4x4_RGBA" | "BC3_RGBA" | "ETC2_RGBA" | "RGBA32", unknown>;
}

declare function LIBKTX(options?: object): Promise<KtxModule>;
