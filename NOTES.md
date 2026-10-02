# NOTES
- Mergeborn: save-on-pagehide overwrites localStorage on reload; seed test saves with addInitScript, not before reload.
- Tests run with node --experimental-strip-types: no enums or TS parameter properties in sim/.
- Mergeborn pacing check: scratch bot (tap 5/s, greedy merge/summon/upgrade) hit stage 25 at 6 min, stage 30 at 52 min. Re-run after balance changes.
- Board is stored 5×5 (stride 5) always; 4×4 just closes column/row 5. Save v1→v2 migrates the old stride-4 board.
- Essence must stay polynomial in stage: an exponential formula with exponential shop boosts ran away to 1e203 by Shuffle 7.
- Shuffle bot (stall 60 s then Shuffle, greedy shop): 10 Shuffles, best stage 68, ~8 min per run.
- Heroes not yet live (Earth→Void) can still be unlocked via Ascend but their skills do nothing until wired; check HEROES[].live.
