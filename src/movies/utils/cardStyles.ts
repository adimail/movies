export function getBorderColor(favorite: boolean): string {
  return favorite ? "#f59e0b" : "#ffffff";
}

export function getEmissiveIntensity(favorite: boolean): number {
  return favorite ? 0.8 : 0;
}
