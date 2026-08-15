import * as THREE from 'three';

// ponytail: barycentric surface sampling — gives uniform distribution across triangles
function sampleTriangle(a, b, c) {
  let u = Math.random(), v = Math.random();
  if (u + v > 1) { u = 1 - u; v = 1 - v; }
  const w = 1 - u - v;
  return [
    a[0] * w + b[0] * u + c[0] * v,
    a[1] * w + b[1] * u + c[1] * v,
    a[2] * w + b[2] * u + c[2] * v,
  ];
}

export function samplePointsFromScene(scene, count) {
  // Collect all triangles with world transforms applied
  const triangles = [];
  const areas = [];
  let totalArea = 0;
  const _v = new THREE.Vector3();

  scene.traverse((child) => {
    if (!child.isMesh) return;
    const geo = child.geometry;
    const pos = geo.attributes.position;
    const idx = geo.index;
    child.updateWorldMatrix(true, false);
    const mat = child.matrixWorld;

    const getVert = (i) => {
      _v.set(pos.getX(i), pos.getY(i), pos.getZ(i)).applyMatrix4(mat);
      return [_v.x, _v.y, _v.z];
    };

    const triCount = idx ? idx.count / 3 : pos.count / 3;
    for (let t = 0; t < triCount; t++) {
      const i0 = idx ? idx.getX(t * 3) : t * 3;
      const i1 = idx ? idx.getX(t * 3 + 1) : t * 3 + 1;
      const i2 = idx ? idx.getX(t * 3 + 2) : t * 3 + 2;
      const a = getVert(i0), b = getVert(i1), c = getVert(i2);

      // Triangle area via cross product
      const ab = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
      const ac = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
      const cx = ab[1] * ac[2] - ab[2] * ac[1];
      const cy = ab[2] * ac[0] - ab[0] * ac[2];
      const cz = ab[0] * ac[1] - ab[1] * ac[0];
      const area = 0.5 * Math.sqrt(cx * cx + cy * cy + cz * cz);
      if (area > 0) {
        triangles.push([a, b, c]);
        areas.push(area);
        totalArea += area;
      }
    }
  });

  // Build CDF for area-weighted sampling
  const cdf = new Float64Array(areas.length);
  cdf[0] = areas[0] / totalArea;
  for (let i = 1; i < areas.length; i++) cdf[i] = cdf[i - 1] + areas[i] / totalArea;

  const points = new Float32Array(count * 3);
  const n = cdf.length;
  for (let i = 0; i < count; i++) {
    const r = Math.random();
    // Binary search (CDF is monotonically non-decreasing) — O(log n) instead of linear scan
    let lo = 0, hi = n - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (r <= cdf[mid]) hi = mid; else lo = mid + 1;
    }
    const ti = lo;
    const [a, b, c] = triangles[ti];
    const p = sampleTriangle(a, b, c);
    points[i * 3] = p[0];
    points[i * 3 + 1] = p[1];
    points[i * 3 + 2] = p[2];
  }

  // Center and normalize to fit inside the container
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
  for (let i = 0; i < count; i++) {
    const x = points[i * 3], y = points[i * 3 + 1], z = points[i * 3 + 2];
    if (x < minX) minX = x; if (x > maxX) maxX = x;
    if (y < minY) minY = y; if (y > maxY) maxY = y;
    if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;
  }
  const cx2 = (minX + maxX) / 2, cy2 = (minY + maxY) / 2, cz2 = (minZ + maxZ) / 2;
  const maxDim = Math.max(maxX - minX, maxY - minY, maxZ - minZ);
  const scale = 1.0 / maxDim;
  for (let i = 0; i < count; i++) {
    points[i * 3] = (points[i * 3] - cx2) * scale;
    points[i * 3 + 1] = (points[i * 3 + 1] - cy2) * scale;
    points[i * 3 + 2] = (points[i * 3 + 2] - cz2) * scale;
  }

  return points;
}
