export async function loadOpenings(): Promise<string[]> {
  try {
    const response = await fetch('/chess/data/gambit.js');
    if (!response.ok) return [];
    const text = await response.text();
    const match = text.match(/"([\s\S]*)"\.split\(" "\)/);
    if (!match) return [];
    return match[1].split(' ');
  } catch {
    return [];
  }
}
