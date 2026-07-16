function decodeHtmlEntities(str: string): string {
    return str
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
  }
  
  export function extractUsername(input: string): string | null {
    let value = input.trim();
    const tmeMatch = value.match(/(?:t\.me|telegram\.me)\/([a-zA-Z0-9_]+)/i);
    if (tmeMatch) return tmeMatch[1];
    if (value.startsWith('@')) value = value.slice(1);
    if (/^[a-zA-Z0-9_]{3,32}$/.test(value)) return value;
    return null;
  }
  
  export function extractProfileInfo(html: string): {
    name: string | null;
    bio: string | null;
    avatarUrl: string | null;
  } {
    let name: string | null = null;
    let bio: string | null = null;
    let avatarUrl: string | null = null;
  
    const nameMatch = html.match(/<div class="tgme_page_title"><span dir="auto">([\s\S]*?)<\/span>/i);
    if (nameMatch) name = decodeHtmlEntities(nameMatch[1].trim());
  
    const bioMatch = html.match(/<div class="tgme_page_description\s*">([\s\S]*?)<\/div>/i);
    if (bioMatch) {
      const cleaned = decodeHtmlEntities(bioMatch[1].replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').trim());
      bio = cleaned.length > 0 ? cleaned : null;
    }
  
    const avatarMatch = html.match(/<img class="tgme_page_photo_image" src="([^"]+)"/i);
    if (avatarMatch) avatarUrl = decodeHtmlEntities(avatarMatch[1]);
  
    return { name, bio, avatarUrl };
  }
  
  export async function fetchTelegramPage(username: string): Promise<{ html: string; isBot: boolean } | null> {
    try {
      const res = await fetch(`https://t.me/${username}`, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
      });
      if (!res.ok) return null;
      const html = await res.text();
      return { html, isBot: html.includes('Start Bot') };
    } catch {
      return null;
    }
  }