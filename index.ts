import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import {
  resample,
  prune,
  dedup,
  draco,
  textureCompress,
} from "@gltf-transform/functions";
import sharp from "sharp"; // Node.js only.
import draco3d from "draco3dgltf";

class IO {
  io: NodeIO | null;

  constructor() {
    this.io = null;
  }

  async init() {
    if (this.io) return this.io;
    this.io = new NodeIO()
    .registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({
      "draco3d.decoder": await draco3d.createDecoderModule(), // Optional.
      "draco3d.encoder": await draco3d.createEncoderModule(), // Optional.
    });
    return this.io;
  }
}

const instance = new IO();


export async function compressGLB(data: Buffer) {
  const io = await instance.init();
  const document = await io.readBinary(data);
  await document.transform(
    // Losslessly resample animation frames.
    resample(),
    // Remove unused nodes, textures, or other data.
    prune(),
    // Remove duplicate vertex or texture data, if any.
    dedup(),
    // Compress mesh geometry with Draco.
    draco(),
    // Convert textures to WebP (Requires glTF Transform v3 and Node.js).
    textureCompress({
      encoder: sharp,
      targetFormat: "webp",
      resize: [1024, 2024],
    }),
    // Custom transform.
    backfaceCulling({ cull: true })
  );
  
  return io.writeBinary(document);
}

// Custom transform: enable/disable backface culling.
function backfaceCulling(options: { cull: boolean }) {
  return (document: any) => {
    for (const material of document.getRoot().listMaterials()) {
      material.setDoubleSided(!options.cull);
    }
  };
}
