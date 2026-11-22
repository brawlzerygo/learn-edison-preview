// Build the preview copy of the Edison site in preview/ (its own git repo, published to edison-preview.learnretro.com
// by `sh build/publish.sh --site preview`). Zack, 2026-11-22: "now that we have the site public, think it would be a
// good idea to make a preview site before pushing to prod". Every change goes to the preview first; the live site only
// gets it once Zack has seen it there.
//
// It copies exactly what the live site would publish (the files git would commit, after build/prerender.mjs ran), then
// makes the copy safe to be public next to the real site: noindex on every page, robots.txt blocking crawlers, no
// sitemap, its own CNAME, and a small "Preview" badge in the corner that links to the live site. Features on trial are
// switched on here only: data-sidenav on <html> turns on the left side nav (js/app.js, end).
import fs from 'fs'; import path from 'path'; import { execFileSync } from 'child_process'; import { fileURLToPath } from 'url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'preview');
const DOMAIN = 'edison-preview.learnretro.com';
const files = execFileSync('git', ['ls-files', '-co', '--exclude-standard'], { cwd: ROOT, encoding: 'utf8' }).split('\n').filter(f => f && fs.existsSync(path.join(ROOT, f)) && !f.startsWith('preview/'));
fs.mkdirSync(OUT, { recursive: true });
for (const e of fs.readdirSync(OUT)) if (e !== '.git') fs.rmSync(path.join(OUT, e), { recursive: true, force: true });
const badge = '<a href="https://edison.learnretro.com/" title="This is the preview site. Open the live site." style="position:fixed;right:12px;bottom:12px;z-index:9999;background:#c2410c;color:#fff;font:700 12px/1 Verdana,sans-serif;letter-spacing:.06em;text-transform:uppercase;padding:7px 10px;border-radius:6px;text-decoration:none;box-shadow:0 2px 8px rgba(0,0,0,.25)">Preview</a>';
let html = 0;
for (const f of files) {
  const src = path.join(ROOT, f), dst = path.join(OUT, f);
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  if (f.endsWith('.html')) {
    let s = fs.readFileSync(src, 'utf8');
    s = s.replace('<html lang="en">', '<html lang="en" data-sidenav>').replace('<head>', '<head>\n<meta name="robots" content="noindex, nofollow">').replace(/<body([^>]*)>/, m => m + '\n' + badge);
    fs.writeFileSync(dst, s); html++;
  } else fs.copyFileSync(src, dst);
}
fs.writeFileSync(path.join(OUT, 'CNAME'), DOMAIN + '\n');
fs.writeFileSync(path.join(OUT, 'robots.txt'), 'User-agent: *\nDisallow: /\n');
fs.rmSync(path.join(OUT, 'sitemap.xml'), { force: true });
fs.writeFileSync(path.join(OUT, 'README.md'), `# Learn Edison: preview\n\nThe preview copy of https://edison.learnretro.com/, at https://${DOMAIN}/. Built by build/make-preview.mjs in the learn-edison repo; not indexed by search engines.\n`);
console.log(`Preview: ${files.length} files (${html} pages) in preview/, for ${DOMAIN}.`);
