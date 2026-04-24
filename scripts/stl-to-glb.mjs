// Convert an STL mesh → binary GLB, centered and scale-normalized.
// Usage: node scripts/stl-to-glb.mjs <in.stl> <out.glb>

import fs from "node:fs";

// three/examples GLTFExporter uses browser-only FileReader — polyfill for Node
if (typeof globalThis.FileReader === "undefined") {
  globalThis.FileReader = class {
    readAsArrayBuffer(blob) {
      blob.arrayBuffer().then((buf) => {
        this.result = buf;
        this.onloadend?.({ target: this });
      });
    }
    readAsDataURL(blob) {
      blob.arrayBuffer().then((buf) => {
        this.result = `data:${blob.type};base64,${Buffer.from(buf).toString("base64")}`;
        this.onloadend?.({ target: this });
      });
    }
  };
}

import * as THREE from "three";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";

const [, , input, output] = process.argv;
if (!input || !output) {
  console.error("usage: node scripts/stl-to-glb.mjs <in.stl> <out.glb>");
  process.exit(1);
}

console.log("loading", input);
const stlBuf = fs.readFileSync(input);
const arrBuf = stlBuf.buffer.slice(
  stlBuf.byteOffset,
  stlBuf.byteOffset + stlBuf.byteLength,
);

const geometry = new STLLoader().parse(arrBuf);
console.log("triangles:", geometry.attributes.position.count / 3);

// STL scans from threedscans are typically Z-up → rotate to Three.js Y-up
geometry.rotateX(-Math.PI / 2);

// Center on origin
geometry.computeBoundingBox();
const center = new THREE.Vector3();
geometry.boundingBox.getCenter(center);
geometry.translate(-center.x, -center.y, -center.z);

// Normalize longest axis to 2 world units
geometry.computeBoundingBox();
const size = new THREE.Vector3();
geometry.boundingBox.getSize(size);
const maxDim = Math.max(size.x, size.y, size.z);
const s = 2.0 / maxDim;
geometry.scale(s, s, s);

// Recompute smooth vertex normals
geometry.computeVertexNormals();

const mesh = new THREE.Mesh(
  geometry,
  new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.55 }),
);
const scene = new THREE.Scene();
scene.add(mesh);

console.log("exporting GLB...");
const exporter = new GLTFExporter();
const glb = await new Promise((resolve, reject) => {
  exporter.parse(
    scene,
    (result) => resolve(result),
    (err) => reject(err),
    { binary: true },
  );
});

fs.writeFileSync(output, Buffer.from(glb));
const mb = (fs.statSync(output).size / 1024 / 1024).toFixed(1);
console.log(`wrote ${output} (${mb} MB)`);
