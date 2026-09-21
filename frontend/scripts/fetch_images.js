import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const datasetPath = path.resolve(__dirname, '../../backend/app/data/trees.json');
const imagesDir = path.resolve(__dirname, '../public/tree-images');

if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

// Create a 1x1 gray pixel as placeholder
const placeholderBuffer = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mMs/wQAAfMB9mX1YzwAAAAASUVORK5CYII=',
  'base64'
);
fs.writeFileSync(path.join(imagesDir, 'placeholder.jpg'), placeholderBuffer);

async function downloadImage(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch image: ${res.statusText}`);
  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  fs.writeFileSync(dest, buffer);
}

async function run() {
  const data = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));
  
  for (let tree of data) {
    const slug = tree.species.toLowerCase().replace(/\s+/g, '-');
    const localFilename = `${slug}.jpg`;
    const localPath = path.join(imagesDir, localFilename);
    const publicUrl = `/tree-images/${localFilename}`;
    
    console.log(`Processing ${tree.species}...`);
    
    try {
      const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(tree.species)}`;
      const res = await fetch(url, { headers: { 'User-Agent': 'CanopyAI/1.0 (test)' } });
      const summary = await res.json();
      
      if (summary.original && summary.original.source) {
        await downloadImage(summary.original.source, localPath);
        console.log(`✅ Success (Original): ${tree.species}`);
        tree.image_urls = [publicUrl];
      }
      else if (summary.thumbnail && summary.thumbnail.source) {
        await downloadImage(summary.thumbnail.source, localPath);
        console.log(`✅ Success (Thumbnail): ${tree.species}`);
        tree.image_urls = [publicUrl];
      } else {
        throw new Error('No image found in Wikipedia response');
      }
    } catch (err) {
      console.log(`❌ Failed: ${tree.species} - ${err.message}`);
      tree.image_urls = ['/tree-images/placeholder.jpg'];
    }
    
    // Slight delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 500));
  }
  
  fs.writeFileSync(datasetPath, JSON.stringify(data, null, 2));
  console.log('✅ Done! trees.json updated.');
}

run().catch(console.error);
