import puppeteer from 'puppeteer';

export async function extractInstagramContent(url: string) {
  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle0' });

    // Extract image URL
    const imageUrl = await page.evaluate(() => {
      const selectors = [
        'img[class*="x5yr21d"]',
        'img[class*="_aagt"]',
        'img[decoding="sync"][style*="width"]',
        'img[class*="_aa1d"]',
        'img[class*="_aagv"]'
      ];

      for (const selector of selectors) {
        const img = document.querySelector(selector);
        if (img && img instanceof HTMLImageElement) {
          const src = img.src;
          if (src && (src.includes('scontent') || src.includes('cdninstagram'))) {
            const width = img.width;
            const height = img.height;
            if (width > 200 && height > 200) {
              return src;
            }
          }
        }
      }
      return null;
    });

    // Extract text content
    const textContent = await page.evaluate(() => {
      const article = document.querySelector('article');
      if (article) return article.textContent || '';

      const captions = document.querySelectorAll('div._a9zs');
      if (captions.length) {
        return Array.from(captions)
          .map(el => el.textContent)
          .filter(Boolean)
          .join('\n');
      }

      return document.body.textContent || '';
    });

    await browser.close();

    if (!textContent) {
      throw new Error('No content found');
    }

    return {
      image_url: imageUrl,
      text_content: textContent,
      url
    };
  } catch (error) {
    console.error('Instagram content extraction error:', error);
    return null;
  }
}