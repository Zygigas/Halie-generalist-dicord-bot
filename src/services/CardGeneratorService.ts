import { createCanvas, GlobalFonts, Image, loadImage } from "@napi-rs/canvas";
import { promises as fs } from 'fs';
import { CharacterSheet } from "./CharacterCardService";

const templateFrontPath = "./src/assets/template1_1.png";
const templateBackPath = "./src/assets/template1_1.png";

const templateWidth = 660
const templateHeight = 1050

    /**
     * "Object-Fit: Cover" implementation for Canvas.
     * Centers the image and crops excess to fill the rectangle without stretching.
     */
function drawImageProp(ctx: any, img: Image, x: number, y: number, w: number, h: number) {
        // Calculate aspect ratios
        const imgRatio = img.width / img.height;
        const targetRatio = w / h;

        let sx, sy, sWidth, sHeight;

        // If image is wider than target (landscape)
        if (imgRatio > targetRatio) {
            sHeight = img.height;
            sWidth = img.height * targetRatio;
            sy = 0;
            sx = (img.width - sWidth) / 2; // Crop sides
        } 
        // If image is taller than target (portrait)
        else {
            sWidth = img.width;
            sHeight = img.width / targetRatio;
            sx = 0;
            sy = (img.height - sHeight) / 2; // Crop top/bottom
        }

        // Draw just the subset of the source image into the target rectangle
        ctx.drawImage(img, sx, sy, sWidth, sHeight, x, y, w, h);
    }

/**
 * Draws text that automatically scales down to fit within a specific bounding box.
 */
function drawTextFit(
    ctx: any,          // The Canvas Context
    text: string,      // The text to write
    fontFace: string,  // The font family name (e.g., 'Roboto')
    x: number,         // Box Top-Left X
    y: number,         // Box Top-Left Y
    w: number,         // Box Width
    h: number,         // Box Height
    color: string      // Text Color
) {
    // 1. Start with the font size equal to the box height (or slightly smaller padding)
    let fontSize = h;
    let minSize = 10; // Don't let it get unreadable

    // 2. Loop: Measure and shrink
    do {
        // Set current font size
        ctx.font = `${fontSize}px "${fontFace}"`;
        
        // Measure width
        const metrics = ctx.measureText(text);
        
        // If it fits width-wise, stop shrinking
        if (metrics.width <= w) {
            break;
        }
        
        // Decrease font size (faster steps for large fonts, precision for small)
        fontSize -= (fontSize > 50) ? 5 : 1;

    } while (fontSize > minSize);

    // 3. Setup Drawing Alignment
    ctx.fillStyle = color;
    ctx.textBaseline = 'middle'; // Vertically center text in the box
    ctx.textAlign = 'center';    // Horizontally center text in the box

    // 4. Draw
    // Note: Because we use 'middle' and 'center', we draw at the CENTER of the box
    ctx.fillText(text, x + (w / 2), y + (h / 2));
}


export async function CardGenerator(character: CharacterSheet) 
{
  const canvas = createCanvas(templateWidth, templateHeight);
  const ctx = canvas.getContext("2d");
  
  const [template1Buffer, template2Buffer , avatarBuffer] = await Promise.all([
            fs.readFile(templateFrontPath),
            fs.readFile(templateBackPath),

            fetch(character.Attire).then(
              async (res) => 
                {
                  if (!res.ok) throw new Error(`Failed to fetch avatar: ${res.statusText}`);
                  const arrayBuffer = await res.arrayBuffer();
                  return Buffer.from(arrayBuffer);
                }
              )
        ]); 
        
  const [template1,template2, avatar] = await Promise.all([
    loadImage(template1Buffer),
    loadImage(template2Buffer),
    loadImage(avatarBuffer)
  ]);
  

  const windowX = 0;
  const windowY = 115;
  const windowWidth = 480;
  const windowHeight = 595;

  drawImageProp(ctx,avatar, windowX, windowY, windowWidth, windowHeight);
  ctx.drawImage(template1, 0, 0, templateWidth, templateHeight);

  drawTextFit(ctx, character.Name, "Arial", 15, 15, 480, 90, "black");

  const buffer = await canvas.encode("png");

  return buffer;

}