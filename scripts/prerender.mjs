/* SEO / GEO build step for the static site in docs/.
   - Renders each public page in headless Edge/Chrome and saves the text into
     the page's HTML, so search engines and AI assistants can read it without
     running JavaScript (React replaces it on load for real visitors).
   - Writes <title>, description, canonical, Open Graph, and JSON-LD per page.
   - Makes / a real homepage, and generates robots.txt, sitemap.xml, llms.txt.
   Run after content changes:  npm run build && npm run prerender */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import vm from 'node:vm';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

// Must be async: the page server runs in this same process, so a blocking call would deadlock.
const run = promisify(execFile);

const DOCS = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1')), '..', 'docs');
const SITE = 'https://www.lakeshorelegendsbasketball.com';
const TODAY = new Date().toISOString().slice(0, 10);
const OG_IMAGE = SITE + '/uploads/gio-highfive-23.jpg';

const ORG = 'LakeShore Legends Basketball';
const LINKEDIN_GIO = 'https://www.linkedin.com/in/gio-paganis/';
const X_ORG = 'https://x.com/LSLegendsHoops';
const IG_GIO = 'https://www.instagram.com/coachgiopag/';
const X_GIO = 'https://x.com/CoachGioPag';
const MAPS_ORG = 'https://www.google.com/maps/place/LakeShore+Legends+Basketball/@41.9743491,-87.795934,10z/data=!3m1!4b1!4m6!3m5!1s0xa30c2e7c809a2921:0x5a95a59e1b3711ea!8m2!3d41.9743491!4d-87.795934!16s%2Fg%2F11zy02tnkz';

// Online prices (Stripe is the source of truth — update here if they change).
const SERVICES = [
  { name: 'Private 1-on-1 Basketball Training', price: '79.99', unit: 'per session', desc: '60-minute private skills training with Coach Gio Paganis for one athlete.' },
  { name: '2-on-1 Small Group Basketball Training', price: '59.99', unit: 'per athlete', desc: '60-minute small group session for two athletes; each family pays for its own athlete.' },
  { name: '3-on-1 Small Group Basketball Training', price: '49.99', unit: 'per athlete', desc: '60-minute small group session for three athletes; each family pays for its own athlete.' },
  { name: '4+ Player Small Group Basketball Training', price: '39.99', unit: 'per athlete', desc: '60-minute small group session for four or more athletes; each family pays for its own athlete.' },
];

const PAGES = [
  { file: 'home.html', url: '/', changefreq: 'weekly', priority: '1.0',
    title: 'LakeShore Legends Basketball | Training-First Youth Basketball in Park Ridge & Mundelein, IL',
    description: 'Training-first youth basketball program led by Coach Gio Paganis. Private 1-on-1 and small group skills training, camps, and player development in Park Ridge and Mundelein, IL.' },
  { file: 'training.html', url: '/training.html', changefreq: 'weekly', priority: '0.9',
    title: 'Book Basketball Training in Park Ridge & Mundelein, IL | LakeShore Legends',
    description: 'Book private 1-on-1 or small group basketball training with Coach Gio Paganis in Park Ridge and Mundelein, IL. See open times, pay securely online, and get instant confirmation.' },
  { file: 'about.html', url: '/about.html', changefreq: 'monthly', priority: '0.8',
    title: 'About LakeShore Legends & Coach Gio Paganis | Youth Basketball Trainer',
    description: 'Meet Coach Gio Paganis, owner of LakeShore Legends Basketball: Park Ridge, IL basketball coach and shooting specialist, Mundelein High School JV head coach, and director of the Jr. Mustangs feeder program.' },
  { file: 'alumni.html', url: '/alumni.html', changefreq: 'monthly', priority: '0.6',
    title: 'Alumni & College Commitments | LakeShore Legends Basketball',
    description: 'LakeShore Legends alumni success stories, college basketball commitments, and the programs that have recruited our athletes.' },
  { file: 'gallery.html', url: '/gallery.html', changefreq: 'monthly', priority: '0.5',
    title: 'Photo Gallery | LakeShore Legends Basketball',
    description: 'Photos from LakeShore Legends Basketball training sessions, camps, and teams in the Chicago area.' },
  { file: 'contact.html', url: '/contact.html', changefreq: 'yearly', priority: '0.6',
    title: 'Contact Coach Gio | LakeShore Legends Basketball, Park Ridge IL',
    description: 'Contact LakeShore Legends Basketball about private training, small groups, camps, or team training in Park Ridge and Mundelein, IL.' },
  { file: 'codes.html', url: '/codes.html', changefreq: 'yearly', priority: '0.4',
    title: 'Codes of Conduct | LakeShore Legends Basketball',
    description: 'Player, parent, and coach codes of conduct for the LakeShore Legends Basketball program.' },
];

/* ---------- structured data ---------- */
const orgNode = {
  '@type': 'SportsOrganization', '@id': SITE + '/#org', name: ORG, alternateName: ['Lake Shore Legends', 'LakeShore Legends'],
  url: SITE + '/', logo: SITE + '/assets/badge-crest.png', image: OG_IMAGE, sport: 'Basketball',
  description: 'A training-first youth basketball program focused on skill development, basketball IQ, and long-term athlete growth.',
  email: 'coachgiopag@gmail.com', telephone: '+1-224-425-9490',
  areaServed: [
    { '@type': 'City', name: 'Park Ridge', containedInPlace: { '@type': 'State', name: 'Illinois' } },
    { '@type': 'City', name: 'Mundelein', containedInPlace: { '@type': 'State', name: 'Illinois' } },
    { '@type': 'AdministrativeArea', name: 'Chicago North and Northwest Suburbs' },
  ],
  founder: { '@id': SITE + '/#gio' }, employee: { '@id': SITE + '/#gio' },
  sameAs: [IG_GIO, X_ORG, MAPS_ORG],
};
const personNode = {
  '@type': 'Person', '@id': SITE + '/#gio', name: 'Gio Paganis', alternateName: 'Coach Gio',
  jobTitle: 'Owner & Head Basketball Trainer', worksFor: { '@id': SITE + '/#org' },
  alumniOf: { '@type': 'CollegeOrUniversity', name: 'Purdue University' },
  homeLocation: { '@type': 'City', name: 'Park Ridge', containedInPlace: { '@type': 'State', name: 'Illinois' } },
  knowsAbout: ['Basketball skills training', 'Shooting development', 'Youth basketball coaching', 'AAU basketball'],
  url: SITE + '/about.html', sameAs: [IG_GIO, X_GIO, LINKEDIN_GIO],
};
const siteNode = { '@type': 'WebSite', '@id': SITE + '/#website', url: SITE + '/', name: ORG, publisher: { '@id': SITE + '/#org' }, inLanguage: 'en-US' };

function loadFaq() {
  const ctx = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(DOCS, 'js', 'faq.js'), 'utf8'), ctx);
  return ctx.window.LSL_FAQ || [];
}

function jsonLd(page) {
  const pageUrl = SITE + page.url;
  const graph = [orgNode, personNode, siteNode];
  const webPage = { '@type': page.file === 'about.html' ? 'AboutPage' : page.file === 'contact.html' ? 'ContactPage' : 'WebPage',
    '@id': pageUrl + '#webpage', url: pageUrl, name: page.title, description: page.description, isPartOf: { '@id': SITE + '/#website' },
    about: { '@id': SITE + '/#org' }, primaryImageOfPage: OG_IMAGE, inLanguage: 'en-US' };
  if (page.url !== '/') {
    webPage.breadcrumb = { '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE + '/' },
      { '@type': 'ListItem', position: 2, name: page.title.split(' | ')[0], item: pageUrl },
    ] };
  }
  graph.push(webPage);
  if (page.file === 'training.html') {
    for (const s of SERVICES) {
      graph.push({ '@type': 'Service', name: s.name, serviceType: 'Basketball training', description: s.desc, provider: { '@id': SITE + '/#org' },
        areaServed: orgNode.areaServed, url: pageUrl,
        offers: { '@type': 'Offer', price: s.price, priceCurrency: 'USD', url: pageUrl, availability: 'https://schema.org/InStock',
          priceSpecification: { '@type': 'UnitPriceSpecification', price: s.price, priceCurrency: 'USD', unitText: s.unit } } });
    }
    graph.push({ '@type': 'FAQPage', '@id': pageUrl + '#faq', mainEntity: loadFaq().map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) });
  }
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph });
}

const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
function headBlock(page) {
  const url = SITE + page.url;
  return [
    '<!-- seo:start (generated by scripts/prerender.mjs) -->',
    `<meta name="description" content="${esc(page.description)}">`,
    `<link rel="canonical" href="${url}">`,
    '<meta property="og:type" content="website">',
    `<meta property="og:site_name" content="${ORG}">`,
    `<meta property="og:title" content="${esc(page.title)}">`,
    `<meta property="og:description" content="${esc(page.description)}">`,
    `<meta property="og:url" content="${url}">`,
    `<meta property="og:image" content="${OG_IMAGE}">`,
    '<meta property="og:locale" content="en_US">',
    '<meta name="twitter:card" content="summary_large_image">',
    '<meta name="twitter:site" content="@LSLegendsHoops">',
    `<meta name="twitter:title" content="${esc(page.title)}">`,
    `<meta name="twitter:description" content="${esc(page.description)}">`,
    `<meta name="twitter:image" content="${OG_IMAGE}">`,
    '<meta name="theme-color" content="#123053">',
    '<link rel="apple-touch-icon" href="assets/badge-crest.png">',
    `<script type="application/ld+json">${jsonLd(page).replace(/</g, '\\u003c')}</script>`,
    '<!-- seo:end -->',
  ].join('\n');
}

/* ---------- local server + headless browser ---------- */
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.json': 'application/json' };
function serve() {
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      const p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      const f = path.join(DOCS, p === '/' ? 'home.html' : p);
      if (!f.startsWith(DOCS) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(f).toLowerCase()] || 'application/octet-stream' });
      fs.createReadStream(f).pipe(res);
    });
    srv.listen(0, '127.0.0.1', () => resolve(srv));
  });
}

function findBrowser() {
  // Chrome first: Edge 154 stopped writing --dump-dom output to stdout (2026-09-30).
  const candidates = [process.env.CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe'];
  const hit = candidates.find((c) => c && fs.existsSync(c));
  if (!hit) throw new Error('No Edge/Chrome found. Set CHROME_PATH.');
  return hit;
}

async function renderRoot(browser, url) {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'lsl-prerender-'));
  let html;
  try {
    ({ stdout: html } = await run(browser, ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--user-data-dir=' + profile,
      '--window-size=1280,2000', '--virtual-time-budget=10000', '--dump-dom', url], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 90000, killSignal: 'SIGKILL' }));
  } finally {
    try { fs.rmSync(profile, { recursive: true, force: true }); } catch (e) { /* Edge may still hold files briefly */ }
  }
  const start = html.indexOf('<div id="root">');
  if (start < 0) throw new Error('No #root in ' + url);
  const after = html.indexOf('<script', start);
  let inner = html.slice(start + '<div id="root">'.length, after).trimEnd();
  if (!inner.endsWith('</div>')) throw new Error('Unexpected DOM shape in ' + url);
  inner = inner.slice(0, -'</div>'.length);
  if (inner.replace(/<[^>]+>/g, '').trim().length < 200) throw new Error('Page rendered almost no text: ' + url);
  return inner;
}

function applyToFile(file, page, rootHtml) {
  const p = path.join(DOCS, file);
  let s = fs.readFileSync(p, 'utf8');
  s = s.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(page.title).replace(/&quot;/g, '"')}</title>`);
  s = s.replace(/\n?<!-- seo:start[\s\S]*?<!-- seo:end -->/, '');
  s = s.replace(/<meta http-equiv="refresh"[^>]*>\n?|<link rel="canonical"[^>]*>\n?/g, '');
  s = s.replace(/(<\/title>)/, '$1\n' + headBlock(page));
  s = s.replace(/<div id="root">(?:<!--prerender-->[\s\S]*?<!--\/prerender-->)?<\/div>/, `<div id="root"><!--prerender-->${rootHtml}<!--/prerender--></div>`);
  fs.writeFileSync(p, s);
}

async function main() {
  const browser = findBrowser();
  const srv = await serve();
  const base = 'http://127.0.0.1:' + srv.address().port;
  try {
    for (const page of PAGES) {
      // Render from a clean copy (no previous snapshot) so the output is stable.
      const root = await renderRoot(browser, base + '/' + page.file + '?prerender=1');
      applyToFile(page.file, page, root);
      console.log('✓', page.file, '→', SITE + page.url);
    }
  } finally { srv.close(); }

  // "/" serves index.html: make it the real homepage instead of a redirect.
  fs.copyFileSync(path.join(DOCS, 'home.html'), path.join(DOCS, 'index.html'));
  console.log('✓ index.html = homepage');

  fs.writeFileSync(path.join(DOCS, 'sitemap.xml'), ['<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...PAGES.map((p) => `  <url><loc>${SITE + p.url}</loc><lastmod>${TODAY}</lastmod><changefreq>${p.changefreq}</changefreq><priority>${p.priority}</priority></url>`),
    '</urlset>', ''].join('\n'));
  fs.writeFileSync(path.join(DOCS, 'robots.txt'), [
    '# Search engines and AI assistants are welcome to read the public pages.',
    'User-agent: *', 'Allow: /', 'Disallow: /coach-admin.html', '', `Sitemap: ${SITE}/sitemap.xml`, ''].join('\n'));
  fs.writeFileSync(path.join(DOCS, 'llms.txt'), llmsTxt());
  console.log('✓ sitemap.xml, robots.txt, llms.txt');
}

function llmsTxt() {
  const faq = loadFaq();
  return `# ${ORG}

> ${ORG} is a training-first youth basketball program based in Park Ridge, Illinois, led by owner and head trainer Coach Gio Paganis. It offers private 1-on-1 and small group basketball skills training, camps, and player development in the Park Ridge and Mundelein, IL areas (Chicago north and northwest suburbs).

## Key facts
- Founder / head trainer: Gio Paganis ("Coach Gio") — from Park Ridge, IL; Purdue M.S.; over a decade coaching and training athletes; head Junior Varsity basketball coach at Mundelein High School; director of the Jr. Mustangs Feeder Basketball program; shooting specialist.
- Philosophy: training first — skill mastery, basketball IQ, and long-term development over playing excessive games.
- Program results: 24 travel teams coached; 250+ athletes trained; 25+ college recruitment offers; 7+ college basketball commitments.
- Locations: Park Ridge, IL and Mundelein, IL areas. The exact gym or court is arranged with Coach Gio after booking.
- Ages: all ages and skill levels for private/small group training; camps typically rising 3rd–8th grade.

## Training and prices (60-minute sessions, booked and paid online)
${SERVICES.map((s) => `- ${s.name}: $${s.price} ${s.unit}`).join('\n')}

## Booking
- Book online: ${SITE}/training.html — choose an open date and time, then pay securely with Stripe. The time is held for 10 minutes during checkout; a confirmation email follows payment.
- Book at least 24 hours in advance. No suitable time? Use "Request Training" on the same page.
- Cancellation: more than 48 hours ahead — 100% refund; within 48 hours — 50% retainer.

## Frequently asked questions
${faq.map((f) => `### ${f.q}\n${f.a}`).join('\n\n')}

## Pages
- [Home](${SITE}/): program overview and philosophy
- [Training & booking](${SITE}/training.html): services, prices, live availability, FAQ
- [About & coaching staff](${SITE}/about.html): Coach Gio Paganis
- [Alumni](${SITE}/alumni.html): former players and college commitments
- [Gallery](${SITE}/gallery.html)
- [Contact](${SITE}/contact.html)
- [Codes of conduct](${SITE}/codes.html)

## Contact
- Email: coachgiopag@gmail.com
- Phone: (224) 425-9490
- Instagram: ${IG_GIO} (@coachgiopag — program and Coach Gio)
- X: ${X_ORG} (program), ${X_GIO} (Coach Gio)
`;
}

main().catch((e) => { console.error(e); process.exit(1); });
