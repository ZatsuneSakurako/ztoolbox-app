import * as Jimp from '@jimp/core';
import png from "@jimp/js-png";
import * as jimpPrint from '@jimp/plugin-print';
import {SANS_14_BLACK} from '@jimp/plugin-print/fonts';
import {loadFont} from '@jimp/plugin-print/load-font';
import * as resize from "@jimp/plugin-resize";
import * as jimpUtils from '@jimp/utils';

export async function addBadgeToImage(imagePath: string, badgeNumber: number): Promise<Buffer> {
	try {
		/**
		 * Read the image
		 * @see https://github.com/jimp-dev/jimp/blob/b6b0e418a5f1259211a133b20cddb4f4e5c25679/packages/jimp/src/index.ts#L34-L138
		 */
		const image = await Jimp.createJimp({
			formats: [png],
			plugins: [
				jimpPrint.methods,
				resize.methods,
			]
		}).read(imagePath);

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
					image.setPixelColor(jimpUtils.cssColorToHex('#FF0000'), x, y);
				}
			}
		}


		const text = badgeNumber > 99 ? '+' : badgeNumber.toString(),
			font = await loadFont(SANS_14_BLACK)

		// Measure the text to calculate its position
		const textWidth = jimpPrint.measureText(font, text);

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
