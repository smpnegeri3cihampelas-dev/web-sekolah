import sharp from 'sharp';
import path from 'path';

async function processLogo() {
  const inputPath = 'C:\\Users\\ICHSAN\\.gemini\\antigravity-ide\\brain\\f9af3be8-39c3-4c11-85dc-15869d2a5144\\.user_uploaded\\media_1790960997084.jpg';
  const outputPath = path.resolve('public/logo.png');
  const output3dPath = path.resolve('public/logo_3d.png');

  const image = sharp(inputPath);
  const metadata = await image.metadata();
  const width = metadata.width;
  const height = metadata.height;

  // Get raw RGBA buffer
  const { data, info } = await image.ensureAlpha().raw().toBuffer({ resolveWithObject: true });

  // Flood fill from outer corners to remove black background
  // Queue for BFS flood fill
  const visited = new Uint8Array(width * height);
  const queue = [];

  // Add all 4 edges to check
  for (let x = 0; x < width; x++) {
    queue.push([x, 0]);
    queue.push([x, height - 1]);
  }
  for (let y = 0; y < height; y++) {
    queue.push([0, y]);
    queue.push([width - 1, y]);
  }

  // Threshold for black background
  const THRESHOLD = 35; // RGB values below this in outer space are considered black background

  let head = 0;
  while (head < queue.length) {
    const [cx, cy] = queue[head++];
    const idx = cy * width + cx;
    if (visited[idx]) continue;
    visited[idx] = 1;

    const pIdx = idx * 4;
    const r = data[pIdx];
    const g = data[pIdx + 1];
    const b = data[pIdx + 2];

    const maxVal = Math.max(r, g, b);

    if (maxVal <= THRESHOLD) {
      // Calculate smooth alpha for anti-aliasing near edges
      if (maxVal <= 15) {
        data[pIdx + 3] = 0;
      } else {
        // Gradient fade
        data[pIdx + 3] = Math.round(((maxVal - 15) / (THRESHOLD - 15)) * 255);
      }

      // Check 4 neighbors
      if (cx > 0 && !visited[idx - 1]) queue.push([cx - 1, cy]);
      if (cx < width - 1 && !visited[idx + 1]) queue.push([cx + 1, cy]);
      if (cy > 0 && !visited[idx - width]) queue.push([cx, cy - 1]);
      if (cy < height - 1 && !visited[idx + width]) queue.push([cx, cy + 1]);
    }
  }

  await sharp(data, {
    raw: {
      width,
      height,
      channels: 4,
    }
  })
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(outputPath);

  await sharp(data, {
    raw: {
      width,
      height,
      channels: 4,
    }
  })
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(output3dPath);

  console.log('Successfully created transparent 3D logo at public/logo.png and public/logo_3d.png');
}

processLogo().catch(err => {
  console.error('Error processing logo:', err);
  process.exit(1);
});
