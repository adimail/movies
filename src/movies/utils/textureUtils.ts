import * as THREE from "three";

const textureCache = new Map<string, THREE.Texture>();
const loader = new THREE.TextureLoader();

function createTextFallback(title: string): THREE.Texture {
  const canvas = document.createElement("canvas");
  canvas.width = 400;
  canvas.height = 600;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#1c1c1c";
  ctx.fillRect(0, 0, 400, 600);

  ctx.fillStyle = "#ebe8e1";
  ctx.font = "bold 32px Georgia, serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const words = title.split(" ");
  let line = "";
  const lines: string[] = [];
  const maxWidth = 340;

  for (let i = 0; i < words.length; i++) {
    const testLine = line + words[i] + " ";
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && i > 0) {
      lines.push(line);
      line = words[i] + " ";
    } else {
      line = testLine;
    }
  }
  lines.push(line);

  const lineHeight = 40;
  const startY = 300 - ((lines.length - 1) * lineHeight) / 2;

  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i].trim(), 200, startY + i * lineHeight);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function loadTexture(url: string, title: string, onLoad: (t: THREE.Texture) => void) {
  if (textureCache.has(url)) {
    onLoad(textureCache.get(url)!);
    return;
  }
  loader.load(
    url,
    (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      textureCache.set(url, tex);
      onLoad(tex);
    },
    undefined,
    () => {
      const fallbackTex = createTextFallback(title);
      textureCache.set(url, fallbackTex);
      onLoad(fallbackTex);
    }
  );
}

