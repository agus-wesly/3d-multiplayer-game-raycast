export type RGB = {
    red: number,
    green: number,
    blue: number,
    alpha: number
}

export const LIME_GREEN: RGB = {
    red: 50,
    green: 205,
    blue: 50,
    alpha: 255,
}

export const GRAY: RGB = { red: 85, green: 85, blue: 85, alpha: 255 }
export const WHITESMOKE = { red: 245, green: 245, blue: 245, alpha: 255 }

export function rgbToString(rgb: RGB): string {
    return `rgba(${rgb.red},${rgb.green},${rgb.blue},${rgb.alpha})`;
} 
