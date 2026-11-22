# Learn Retro ideas (not started)

Ideas Zack has floated that aren't plans yet. A session treats these as plans to discuss, not rules, until they move into CLAUDE.md. (This folder is published with the site, so keep nothing private here.)

## Learn Retro Instagram (Zack, 2026-11-22)
An Instagram account for Learn Retro that posts about everything retro Yu-Gi-Oh!.
- **Big retro card sales:** the most consistent content. Recent examples Zack named: Black Rose Dragon, Stardust Dragon, Blue-Eyes White Dragon, Dark Magician. The model is the geekycorner Instagram account, which covers big eBay sales. Every price needs a sold record with its source and month on the post, like the brawlzerygo price rule: no listing prices and no guesses.
- **New set news:** new sets that reprint cards from retro formats.
- **Data sources (Claude's read, 2026-11-22, to confirm before building):** eBay's Finding API (sold-listing search) was shut down in early 2025, and its replacement for sold data (Marketplace Insights) is restricted and needs eBay's approval; the open Browse API shows only live listings; scraping eBay breaks its terms. Paid: PriceCharting's API (built on eBay sold data). TCGplayer gives no new API keys, but tcgcsv.com (free daily dumps of TCGplayer prices) and YGOPRODeck's API (TCGplayer prices per card, already used) can feed a daily trend log of the retro card pool that flags cards rising week over week. Those are market prices, labeled as such ("TCGplayer market price, Nov 2026"), not sold records. Ask Zack before adding any paid service.
- **To settle first:** the handle and account (a new account on brawlzerygo@gmail.com, like the YouTube channel), the post format (carousel or single image), how often to post, how sales are found and checked, and whether it posts through Buffer as a fourth channel (Buffer bills per channel).

## Blog on learnretro.com (Zack, 2026-11-22; built, see CLAUDE.md)
A blog on the site, mainly for search traffic: the same news (big sales, retro reprints in new sets) plus general help articles and stories. Each post is written in our own words with its sources linked. To settle: the hub (learnretro.com) or each format's subdomain, the URL scheme (real pages, not #hash links, so search engines index each post), and how posts get written and published (publish.sh).

## Course videos in the Library (Zack, 2026-11-22)
Once the course videos are all done, add them to the Edison site's Library page, at the top, above the creator videos.
