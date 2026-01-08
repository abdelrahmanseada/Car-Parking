import tokensJson from "./tokens.json";

type Tokens = typeof tokensJson;

export const tokens: Tokens = tokensJson;

export const colors = tokens.colors;
export const spacing = tokens.spacing;
export const fonts = tokens.fonts;
export const radius = tokens.radius;
