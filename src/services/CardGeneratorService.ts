import { createCanvas, GlobalFonts, Image, loadImage } from "@napi-rs/canvas";
import { promises as fs } from 'fs';
import { CharacterSheet } from "./CharacterCardService";

const templateFrontPath = "./src/assets/template1_1.png";
const templateBackPath = "./src/assets/template1_1.png";

const templateWidth = 660
const templateHeight = 1050

interface BoundingBox {
    x: number;
    y: number;
    width: number;
    height: number;
}

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

/**
     * Draws multi-line text that automatically wraps and scales down to fit within a specific bounding box.
     * Prioritizes fitting all text by reducing font size.
     */
    function drawTextBox(
        ctx: any,             // The Canvas Context
        text: string,         // The text to write
        fontFace: string,     // The font family name (e.g., 'Roboto')
        box: BoundingBox ,     // { x, y, width, height }
        color: string,        // Text Color
        lineHeightRatio: number = 1.2 // How much space between lines (e.g., 1.2 * font size)
    ) {
        let currentFontSize = box.height; // Start with height as max possible font size
        const minFontSize = 10;           // Smallest readable font size
        let lines: string[] = [];         // To store wrapped lines

        // Save context state if you have shadows/alignments to manage
        ctx.save(); 
        ctx.fillStyle = color;
        ctx.textAlign = 'left'; // Default to left alignment for paragraphs
        ctx.textBaseline = 'top'; // Default to top baseline for paragraphs

        // ==========================================================
        // MAIN LOOP: Adjust Font Size until Text Fits
        // ==========================================================
        let maxLines = 0; // The maximum number of lines allowed given the box height and line height ratio

        do {
            // Calculate max lines for current font size
            maxLines = Math.floor(box.height / (currentFontSize * lineHeightRatio));
            if (maxLines <= 0) { // If font size is too big to even fit one line vertically
                currentFontSize -= 1;
                if (currentFontSize < minFontSize) {
                    console.warn("Text box is too small to fit any text at min font size.");
                    ctx.restore();
                    return; // Can't fit anything, abort
                }
                continue; // Try again with smaller font
            }

            // Wrap text for the current font size and box width
            lines = wrapText(ctx, text, fontFace, currentFontSize, box.width);
            
            // If the number of lines exceeds the maximum allowed lines for this font size,
            // or if we couldn't fit the text at all (empty lines array),
            // then we need to decrease the font size and try again.
            if (lines.length > maxLines || lines.length === 0) {
                currentFontSize -= 1; // Decrease font size
            } else {
                // Text fits! Break out of the loop.
                break;
            }

            // If font size goes below minimum, stop trying
            if (currentFontSize < minFontSize) {
                console.warn(`Text "${text.substring(0, 30)}..." cannot fully fit in box at min font size.`);
                // We'll still draw what we can at minFontSize
                break; 
            }

        } while (true); // Loop until `break` or `return`

        // ==========================================================
        // DRAW THE FITTED TEXT
        // ==========================================================
        
        // Ensure we're drawing at the determined font size
        ctx.font = `${currentFontSize}px "${fontFace}"`;

        // Start drawing from the top of the box
        let currentY = box.y;
        for (let i = 0; i < lines.length; i++) {
            // If we've exceeded the vertical space, stop drawing
            if (currentY + currentFontSize * lineHeightRatio > box.y + box.height + currentFontSize * lineHeightRatio / 2) {
                // Add ellipsis if we couldn't fit everything
                if (i < lines.length - 1) { 
                    const lastLine = lines[i];
                    lines[i] = addEllipsis(ctx, lastLine, box.width);
                }
            }
            
            ctx.fillText(lines[i], box.x, currentY);
            currentY += currentFontSize * lineHeightRatio;
        }

        ctx.restore(); // Restore context state
    }

    /**
     * Helper: Wraps text into lines that fit within a given width.
     * Returns an array of lines.
     */
    function wrapText(
        ctx: any, 
        text: string, 
        fontFace: string, 
        fontSize: number, 
        maxWidth: number
    ): string[] {
        const words = text.split(' ');
        let lines: string[] = [];
        let currentLine = '';

        ctx.font = `${fontSize}px "${fontFace}"`;

        for (let i = 0; i < words.length; i++) {
            const word = words[i];
            const testLine = currentLine + (currentLine === '' ? '' : ' ') + word;
            const metrics = ctx.measureText(testLine);

            if (metrics.width < maxWidth) {
                currentLine = testLine;
            } else {
                // If a single word is too long for the line, break it
                if (currentLine === '') {
                    // This is a complex scenario: a single word is wider than the box.
                    // For simplicity, we'll force it onto one line and let it overflow for now.
                    // A more advanced solution would implement character-level wrapping here.
                    lines.push(word); 
                } else {
                    lines.push(currentLine);
                    currentLine = word;
                }
            }
        }
        if (currentLine !== '') {
            lines.push(currentLine);
        }
        return lines;
    }

    /**
     * Helper: Adds ellipsis to a line if it exceeds maxWidth.
     */
    function addEllipsis(ctx: any, line: string, maxWidth: number): string {
        const ellipsis = '...';
        let tempLine = line;
        
        ctx.font = ctx.font; // Ensure font is set from wrapText context
        
        while (ctx.measureText(tempLine + ellipsis).width > maxWidth && tempLine.length > 0) {
            tempLine = tempLine.substring(0, tempLine.length - 1);
        }
        return tempLine.trim() + ellipsis;
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

 

  const longDescription = "This is a very long description that needs to be wrapped and scaled to fit neatly within the designated text box on the character card. It will automatically adjust its font size and break into multiple lines to ensure all content is visible and legible without overflowing the bounds. We want it to look good no matter how much text is provided by the user.";
  
  

  const windowX = 0;
  const windowY = 115;
  const windowWidth = 480;
  const windowHeight = 595;

   const desription: BoundingBox = {
    x: 20,
    y: 815,
    width: 485,
    height: 230
  }

  drawImageProp(ctx,avatar, windowX, windowY, windowWidth, windowHeight);
  ctx.drawImage(template1, 0, 0, templateWidth, templateHeight);

  drawTextFit(ctx, character.Name, "Arial", 15, 15, 480, 90, "black");

  drawTextBox(ctx, longDescription, "Arial", desription,'#000000', 1.2);

  const buffer = await canvas.encode("png");

  return buffer;

}