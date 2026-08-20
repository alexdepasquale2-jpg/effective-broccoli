# Legal

Short version: the assets and game data are public domain, our code is MIT, and the _Glitch_ name is
not ours to use.

## What Tiny Speck released, and under what

In 2013–14, after closing _Glitch_, Tiny Speck released the game's art, animation, music, and
server-side game code into the public domain under
[CC0 1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/) — around 10,000 art assets
and the complete `glitch-GameServerJS`.

CC0 is a full waiver of copyright, not a licence with conditions. There is **no attribution
requirement**, no share-alike, and commercial use is permitted.

## What is excluded

**The Glitch name and logo.** They were explicitly held back from the release and remain trademarks.
This is why the project is called _Project Glimmer_ and why no Glitch branding appears in the client,
the repo, or any marketing.

Trademark and copyright are separate things: having the art in the public domain does not grant any
right to trade under the name it was published as.

## What this project does

- Uses the CC0 art and game data freely, as intended.
- **Credits Tiny Speck anyway** in [`CREDITS.md`](../CREDITS.md), because it is the decent thing to
  do and it makes the project's provenance legible.
- Ships its own code under MIT ([`LICENSE`](../LICENSE)).
- Does not use the Glitch name or logo in branding.
- Never commits vendored CC0 sources — they are fetched on demand into gitignored `vendor/`, so the
  repository stays our own work plus a fetch script.

## Third-party code

`ElevenGiants/eleven-server` is MIT. We read it as a reference for how the original server was
shaped, but do not use its code. If any of it is ever borrowed, its MIT notice must be carried
alongside.

## Before anything ships publicly

- [ ] Re-verify the CC0 status of every asset actually shipped, at the point of shipping.
- [ ] Confirm no Glitch trademark appears in the client, store listing, or domain name.
- [ ] Carry the MIT notice for any third-party code that ends up vendored.
