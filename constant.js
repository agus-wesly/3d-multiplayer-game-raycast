export const LIME_GREEN = {
    red: 50,
    green: 205,
    blue: 50,
    alpha: 255,
};
export const GRAY = { red: 85, green: 85, blue: 85, alpha: 255 };
export const WHITESMOKE = { red: 245, green: 245, blue: 245, alpha: 255 };
export function rgbToString(rgb) {
    return `rgba(${rgb.red},${rgb.green},${rgb.blue},${rgb.alpha})`;
}
