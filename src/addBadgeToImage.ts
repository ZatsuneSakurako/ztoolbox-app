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
		const badgeX = 22,
			badgeY = 0;

		// Draw a red circle for the badge background
		image.scan(badgeX, badgeY, 12, 12, function(x, y) {
			this.setPixelColor(jimp.rgbaToInt(255, 0, 0, 255), x, y);
		});

		const text = badgeNumber > 9 ? '+' : badgeNumber.toString(),
			font = await jimp.loadFont(SANS_14_BLACK)

		// Measure the text to calculate its position
		const textWidth = jimp.measureText(font, text);

		// Add the text to the image, in the top right corner
		image.print({
			font,
			x: image.bitmap.width - textWidth - 1,
			y: -4,
			text,
		});

		// Convert to buffer
		return await image.getBuffer("image/png");
	} catch (error) {
		console.error('Error adding badge to image:', error);
		throw error;
	}
}
