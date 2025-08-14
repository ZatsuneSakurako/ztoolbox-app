import * as jimp from 'jimp';
import {Jimp} from 'jimp';
import {SANS_14_BLACK} from 'jimp/fonts';

export async function addBadgeToImage(imagePath: string, badgeNumber: number): Promise<Buffer> {
	try {
		// Read the image
		const image = await Jimp.read(imagePath);

		// Resize image to 32x32 if not already that size
		image.resize({ h: 32, w: 32 });

		// Badge position (bottom right corner)
		let posX = image.width - 6,
			posY = 6,
			circleRadius = 7,
			textOffsetY = 0
		;

		if (badgeNumber > 9) {
			posX = image.width - 9;
			posY = 9;
			circleRadius = 9;
			textOffsetY = 2;
		}

		// Draw a filled red circle
		for (let x = 0; x < image.height; x++) {
			for (let y = 0; y < image.width; y++) {
				// Calculate distance from center
				const dx = x - posX,
					dy = y - posY,
					distance = Math.sqrt(dx * dx + dy * dy);
				if (distance <= circleRadius) {
					image.setPixelColor(jimp.rgbaToInt(255, 0, 0, 255), x, y);
				}
			}
		}


		const text = badgeNumber > 99 ? '+' : badgeNumber.toString(),
			font = await jimp.loadFont(SANS_14_BLACK)

		// Measure the text to calculate its position
		const textWidth = jimp.measureText(font, text);

		// Add the text to the image, in the top right corner
		image.print({
			font,
			x: image.bitmap.width - textWidth - 1,
			y: -4 + textOffsetY,
			text,
		});

		// Convert to buffer
		return await image.getBuffer("image/png");
	} catch (error) {
		console.error('Error adding badge to image:', error);
		throw error;
	}
}
