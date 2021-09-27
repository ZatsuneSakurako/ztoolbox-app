export class Color {
	R:number;
	G:number;
	B:number;
	constructor(hexColorCode:string){
		const getCodes =  /^#([\da-fA-F]{2,2})([\da-fA-F]{2,2})([\da-fA-F]{2,2})$/;
		if(getCodes.test(hexColorCode)){
			const result = getCodes.exec(hexColorCode);
			this.R= parseInt(result[1],16);
			this.G= parseInt(result[2],16);
			this.B= parseInt(result[3],16);
		}
	}

	// noinspection JSUnusedGlobalSymbols
	rgbCode() {
		return "rgb(" + this.R + ", " + this.G + ", " + this.B + ")";
	}

	/* RGB to HSL function from https://stackoverflow.com/questions/2353211/hsl-to-rgb-color-conversion/9493060#9493060 */
	getHSL(){
		let r = this.R;let g = this.G;let b = this.B;

		r /= 255; g /= 255; b /= 255;
		let max = Math.max(r, g, b), min = Math.min(r, g, b);
		let h, s, l = (max + min) / 2;

		if (max === min) {
			h = s = 0; // achromatic
		} else {
			let d = max - min;
			s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
			switch(max){
				case r: h = (g - b) / d + (g < b ? 6 : 0); break;
				case g: h = (b - r) / d + 2; break;
				case b: h = (r - g) / d + 4; break;
			}
			h /= 6;
		}
		return {"H": h * 360, "S": s * 100 + "%", "L": l * 100 + "%"};
	}
}