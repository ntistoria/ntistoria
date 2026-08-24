import fs from 'fs';
import path from 'path';

function transliterateGeorgian(str) {
  if (!str) return '';
  const geoMap = {
    'ა': 'a', 'ბ': 'b', 'გ': 'g', 'დ': 'd', 'ე': 'e', 'ვ': 'v', 'ზ': 'z',
    'თ': 't', 'ი': 'i', 'კ': 'k', 'ლ': 'l', 'მ': 'm', 'ნ': 'n', 'ო': 'o',
    'პ': 'p', 'ჟ': 'zh', 'რ': 'r', 'ს': 's', 'ტ': 't', 'უ': 'u', 'ფ': 'p',
    'ქ': 'q', 'ღ': 'gh', 'ყ': 'q', 'შ': 'sh', 'ჩ': 'ch', 'ც': 'ts', 'ძ': 'dz',
    'წ': 'ts', 'ჭ': 'ch', 'ხ': 'kh', 'ჯ': 'j', 'ჰ': 'h'
  };
  return str.split('').map(char => geoMap[char] || char).join('');
}

function generateSlug(title, fallbackId) {
  if (!title) return fallbackId || `art-${Date.now()}`;
  const latinized = transliterateGeorgian(title.trim().toLowerCase());
  const cleanSlug = latinized.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  if (!cleanSlug || cleanSlug.length < 2 || /^[-]+$/.test(cleanSlug)) {
    return fallbackId || `art-${Date.now()}`;
  }
  return cleanSlug;
}

export default async function handler(req, res) {
  const urlObj = new URL(req.url, `https://${req.headers.host || 'ntistoria.vercel.app'}`);
  let slug = req.query?.slug || urlObj.searchParams.get('slug');

  if (!slug) {
    const pathnameParts = urlObj.pathname.split('/').filter(Boolean);
    if (pathnameParts[0] === 'blog' && pathnameParts[1]) {
      slug = pathnameParts[1];
    }
  }

  const defaultMeta = {
    title: 'NT ისტორიის მასწავლებელი — ეროვნული გამოცდების მოსამზადებელი',
    description: 'ისტორიის პედაგოგ ნოდარ თოთაძის მოსამზადებელი პორტალი. ეროვნული გამოცდების ტესტები, ისტორიული ბლოგი, რუკები და ვიდეო გაკვეთილები.',
    imageUrl: 'https://enjnwxpzafroxapksdlt.supabase.co/storage/v1/object/public/photos/logpng.png',
    url: `https://ntistoria.vercel.app${slug ? `/blog/${encodeURIComponent(slug)}` : '/'}`,
    type: slug ? 'article' : 'website'
  };

  let meta = { ...defaultMeta };
  let articleData = null;

  if (slug) {
    try {
      const decodedSlug = decodeURIComponent(slug);
      const supabaseUrl = `https://enjnwxpzafroxapksdlt.supabase.co/rest/v1/articles?select=*`;
      const response = await fetch(supabaseUrl, {
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVuam53eHB6YWZyb3hhcGtzZGx0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAzNzc1MzUsImV4cCI6MjA1NTk1MzUzNX0.V5VvG1R8FkLd_dZk',
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        const articles = await response.json();
        if (articles && articles.length > 0) {
          const article = articles.find(a => {
            const aSlug = a.slug ? a.slug.trim() : '';
            const genSlug = generateSlug(a.title, a.id);
            return (
              a.id === decodedSlug ||
              aSlug === decodedSlug ||
              genSlug === decodedSlug ||
              (aSlug.startsWith('---') && genSlug === decodedSlug) ||
              genSlug.startsWith(decodedSlug) ||
              decodedSlug.startsWith(genSlug)
            );
          }) || articles[0];

          if (article) {
            articleData = article;
            const finalSlug = generateSlug(article.title, article.id);
            meta.title = `${article.title} — NT ისტორიის მასწავლებელი`;
            meta.description = article.excerpt 
              ? (article.excerpt.length > 155 ? `${article.excerpt.slice(0, 155)}...` : article.excerpt)
              : `წაიკითხეთ სტატია "${article.title}" - NT ისტორიის მასწავლებელი ნოდარ თოთაძე.`;
            meta.imageUrl = article.image_url || article.imageUrl || defaultMeta.imageUrl;
            meta.url = `https://ntistoria.vercel.app/blog/${encodeURIComponent(finalSlug)}`;
          }
        }
      }
    } catch (err) {
      console.error('Error fetching article metadata for OG:', err);
    }
  }

  const escapeHtml = (str = '') =>
    String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  const titleHtml = escapeHtml(meta.title);
  const descHtml = escapeHtml(meta.description);
  const imageHtml = escapeHtml(meta.imageUrl);
  const urlHtml = escapeHtml(meta.url);

  const jsonLd = articleData ? JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": articleData.title,
    "description": articleData.excerpt,
    "image": meta.imageUrl,
    "author": {
      "@type": "Person",
      "name": articleData.author || "ნოდარ თოთაძე"
    },
    "publisher": {
      "@type": "Organization",
      "name": "NT ისტორიის მასწავლებელი",
      "logo": {
        "@type": "ImageObject",
        "url": "https://enjnwxpzafroxapksdlt.supabase.co/storage/v1/object/public/photos/logpng.png"
      }
    },
    "datePublished": articleData.date || "2026-08-24",
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": meta.url
    }
  }) : '';

  // Attempt reading production dist/index.html to use built script tags if available
  let baseHtml = '';
  try {
    const distPath = path.join(process.cwd(), 'dist', 'index.html');
    if (fs.existsSync(distPath)) {
      baseHtml = fs.readFileSync(distPath, 'utf8');
    }
  } catch (e) {}

  let html = '';
  if (baseHtml) {
    html = baseHtml
      .replace(/<title>.*?<\/title>/gi, `<title>${titleHtml}</title>`)
      .replace(/<meta name="description" content=".*?" \/>/gi, `<meta name="description" content="${descHtml}" />`)
      .replace(/<meta property="og:title" content=".*?" \/>/gi, `<meta property="og:title" content="${titleHtml}" />`)
      .replace(/<meta property="og:description" content=".*?" \/>/gi, `<meta property="og:description" content="${descHtml}" />`)
      .replace(/<meta property="og:image" content=".*?" \/>/gi, `<meta property="og:image" content="${imageHtml}" />`)
      .replace(/<meta property="og:url" content=".*?" \/>/gi, `<meta property="og:url" content="${urlHtml}" />`);
  } else {
    html = `<!doctype html>
<html lang="ka">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${titleHtml}</title>
    <meta name="description" content="${descHtml}" />
    <meta name="author" content="ნოდარ თოთაძე" />
    <meta name="robots" content="index, follow, max-image-preview:large" />

    <!-- Canonical Link -->
    <link rel="canonical" href="${urlHtml}" />

    <!-- Open Graph / Facebook / LinkedIn / Telegram / WhatsApp -->
    <meta property="og:type" content="${meta.type}" />
    <meta property="og:site_name" content="NT ისტორიის მასწავლებელი" />
    <meta property="og:locale" content="ka_GE" />
    <meta property="og:url" content="${urlHtml}" />
    <meta property="og:title" content="${titleHtml}" />
    <meta property="og:description" content="${descHtml}" />
    <meta property="og:image" content="${imageHtml}" />

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:url" content="${urlHtml}" />
    <meta name="twitter:title" content="${titleHtml}" />
    <meta name="twitter:description" content="${descHtml}" />
    <meta name="twitter:image" content="${imageHtml}" />

    <link rel="icon" type="image/png" href="https://enjnwxpzafroxapksdlt.supabase.co/storage/v1/object/public/photos/logpng.png" />
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700;800&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&family=Inter:wght@300;400;500;600;700&family=Noto+Sans+Georgian:wght@300;400;500;600;700&family=Noto+Serif+Georgian:wght@400;500;600;700&display=swap" rel="stylesheet">
    ${jsonLd ? `<script type="application/ld+json">${jsonLd}</script>` : ''}
  </head>
  <body class="bg-[#FAF8F3] text-[#1B1B1B] antialiased selection:bg-[#C79B3A] selection:text-[#0D1B2A]">
    <div id="root"></div>
  </body>
</html>`;
  }

  if (res && typeof res.setHeader === 'function') {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    return res.status(200).send(html);
  }

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 's-maxage=60, stale-while-revalidate=300'
    }
  });
}
