#!/usr/bin/env python3
"""patch184 - remove the white border around Fluke completely (Kevin, 2026-11-27).

Kevin's ruling (live call, 2026-11-27 ~13:12 EST, restated ~18:03): the white
border that appears around Fluke (the player character) when he moves is to be
removed completely - "I want it always hide him. I want it to be removed
completely." No selected-only state, no toggle.

Investigation (lane sn-border-spec, 20 agents, code + pixel evidence):
- No code anywhere in the file draws a border/outline/strokeRect around the
  player, conditionally on movement or otherwise (three independent greps:
  drawPlayer/drawFlukeSprite, hitbox/debug search, selected/highlight search).
  drawFlukeSprite() is a bare drawImage of sprites/frames/fluke_<sheet>_<i>.png;
  the canvas fallback's outlines are all the dark cel colour #20130a.
- The sprite PNGs are clean: all 55 frames in the publish tree have alpha 0 on
  every edge, ~20/6500 near-white opaque pixels per frame (the hard hat), and
  semi-transparent edge pixels carry DARK rgb - no white fringe is baked in.
- What CAN paint white at a sprite's edge is the WebGL renderer's shared
  atlas: patternRegion() packs every image edge-to-edge against its
  neighbours (shelf packing, zero padding), the texture is sampled with
  LINEAR filtering, and the drawImage shader path maps the region with NO
  inset (uv = reg.u0 + fract(vUV) * (reg.u1 - reg.u0)). A tap at the quad
  edge therefore straddles the region boundary and pulls in the neighbouring
  cell - white glyph strokes (glyphs are drawn '#ffffff') or the white
  fallback cell - which reads as a light/white border around the sprite,
  most visible while walking (walk frames cycle, the edge shimmers). The
  same mechanism in its hard form (atlas full -> region becomes the WHITE
  cell) is documented in-file at patch92/patch143 and was photographed in
  the ship #24 playtest: a panel rendered as a solid white rectangle.

Fix (renderer-level, so the border cannot occur for any sprite, in any
atlas state):
1. drawImage sources get their own regions via a new imageRegion(): the
   image is allocated with a 1 px transparent moat on every side
   (atlasAlloc(w + 2, h + 2), drawn at cell + 1), and the region UVs cover
   exactly the image's own texels. An edge tap can now only reach this
   image's own transparent padding - neighbour bleed is physically
   impossible, and the image content itself is unchanged (the moat is
   outside the sampled region).
2. If the atlas is full, imageRegion falls back to a new CLEAR region (a
   permanently transparent 2x2 cell reserved beside the white cell on the
   first shelf; the shelf's first allocation now starts at x = 4) instead
   of WHITE: a sprite that cannot be atlased draws nothing, never a white
   quad. The white cell itself is byte-identical and still serves solid
   fills exactly as before.
3. createPattern fills keep patternRegion() untouched - patterns tile via
   fract() and rely on wrap, so they must not gain a moat. Mode 5 (steam)
   reads its noise rect via regionOf()/patternRegion as before; its base
   sprite now rides imageRegion like every other drawImage, content
   unchanged.

Physics untouched (the patch asserts the BWR block MD5 before and after).
"""
from _patchlib import apply

BASE = '3564382cf935547b07906691c44530ab'   # current main game file (post-ship-25 patch183 build, 1,100,949 B)

E1_OLD = """  var WHITE = { u0: 0.25 / ATLAS_SIZE, v0: 0.25 / ATLAS_SIZE, u1: 1.75 / ATLAS_SIZE, v1: 1.75 / ATLAS_SIZE };
  var shelves = [{ y: 0, h: 4, x: 2 }];"""
E1_NEW = """  var WHITE = { u0: 0.25 / ATLAS_SIZE, v0: 0.25 / ATLAS_SIZE, u1: 1.75 / ATLAS_SIZE, v1: 1.75 / ATLAS_SIZE };
  // patch184: a permanently transparent cell beside the white one (x 2..4 on
  // the reserved first shelf; never painted, and the shelf now starts handing
  // out space at x = 4 so nothing allocates over it) - the fallback region
  // for image draws when the atlas is full, so a sprite can never be painted
  // as a white quad.
  var CLEAR = { u0: 2.25 / ATLAS_SIZE, v0: 0.25 / ATLAS_SIZE, u1: 3.75 / ATLAS_SIZE, v1: 1.75 / ATLAS_SIZE };
  var shelves = [{ y: 0, h: 4, x: 4 }];"""

E2_OLD = """    patternRegions.set(src, reg);
    return reg;
  }

  // ---------------- vertex emission ----------------"""
E2_NEW = """    patternRegions.set(src, reg);
    return reg;
  }

  // patch184 (Kevin, 2026-11-27 - the white border around Fluke, removed
  // completely): drawImage sources get their OWN atlas regions with a 1 px
  // transparent moat. patternRegion() packs images edge-to-edge against
  // their neighbours, and the shader samples with LINEAR filtering and no
  // inset, so a quad-edge tap straddles the region boundary and pulls in
  // whatever cell sits next door - white glyph strokes or the white
  // fallback cell read as a light border around the sprite (most visible
  // while walking, when the walk frames cycle and the edge shimmers). With
  // the moat, an edge tap can only ever reach this image's own transparent
  // padding. If the atlas is full the region falls back to CLEAR (fully
  // transparent) instead of WHITE: a missing sprite draws nothing, never a
  // white quad. createPattern fills keep patternRegion() - patterns tile
  // via fract() and rely on wrap, so they must not gain a moat.
  var imageRegions = new Map();
  function imageRegion(src) {
    if (imageRegions.has(src)) return imageRegions.get(src);
    var w = src.width || 0, h = src.height || 0;
    if (!w || !h) return patternRegion({ src: src });
    var cell = atlasAlloc(w + 2, h + 2);
    var reg;
    if (!cell) { reg = { u0: CLEAR.u0, v0: CLEAR.v0, u1: CLEAR.u1, v1: CLEAR.v1 }; imageRegions.set(src, reg); return reg; }
    atlasCtx.clearRect(cell.x, cell.y, w + 2, h + 2);
    try { atlasCtx.drawImage(src, cell.x + 1, cell.y + 1); } catch (e) {}
    atlasMarkDirty(cell.x, cell.y, w + 2, h + 2);
    reg = { u0: (cell.x + 1) / ATLAS_SIZE, v0: (cell.y + 1) / ATLAS_SIZE, u1: (cell.x + 1 + w) / ATLAS_SIZE, v1: (cell.y + 1 + h) / ATLAS_SIZE };
    imageRegions.set(src, reg);
    return reg;
  }

  // ---------------- vertex emission ----------------"""

E3_OLD = """    var reg = patternRegion({ src: src });"""
E3_NEW = """    var reg = imageRegion(src);   // patch184: padded image region (patternRegion is unpadded - its edge taps bled neighbouring atlas cells into a light border around sprites)"""

E4_OLD = """    // atlas via patternRegion(); the quad carries explicit UVs"""
E4_NEW = """    // atlas via imageRegion() (patch184: padded); the quad carries explicit UVs"""

apply(184, BASE, [(E1_OLD, E1_NEW), (E2_OLD, E2_NEW), (E3_OLD, E3_NEW), (E4_OLD, E4_NEW)])
