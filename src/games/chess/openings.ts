function assetUrl(path: string): string {
  const base = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL) || '/';
  return `${String(base).replace(/\/$/, '')}${path}`;
}

export async function loadOpenings(): Promise<string[]> {
  try {
    const response = await fetch(assetUrl('/chess/data/gambit.js'));
    if (!response.ok) return [];
    const text = await response.text();
    const match = text.match(/"([\s\S]*)"\.split\(" "\)/);
    if (!match) return [];
    return match[1].split(' ');
  } catch {
    return [];
  }
}
