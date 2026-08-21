# The Codex of Zha'elim

_Working notes, kept outside the vessel. In-world throughout; the engineering rationale for each
choice is in the parentheses, because the Kor insisted the reasons travel with the rules._

---

## I. The three

### Vel'zhu — the Plasmoid

Structure that has learned to hold itself in plasma, as you are structure that has learned to hold
itself in water. They live in the convection cells of stars and in the thin electric skin above
your weather. Nothing they are lasts more than moments in your counting, and they do not experience
this as tragedy: _a thing that arrives fully is not shortened by leaving._

Their tongue reaches three rings. They do not travel far. They arrive completely.

**Their games are all timing games**, because strategy in your sense requires a lifespan they do
not have. The oldest is _krau_ — "the moment before it goes wrong" — in which several of them fall
into a convection cell and try to be the last to correct course. Correcting late loses. Correcting
early also loses. Every round teaches you something about your own flinch.

### Kor'aen — the Blue Avian

Blue and avian are approximations your eyes chose, and the Kor accept them, because approximation
is a courtesy. What is accurate: they hold form. Where the Vel arrive and the Sha persist, the Kor
make sure that what arrived is what was sent.

**Their games are lattices with exactly one door hidden in each.** The pleasure is not in finding
the door; it is in the moment you become certain there is one. Their word for a door built into a
wall on purpose, _korvaeth_, is also their word for a good teacher.

They are the reason this vessel does not lie about its rules. _(Every authored lattice is run
through a solver before it is allowed in — `tools/verify-songs.mjs`. An impossible puzzle presented
as hard is a small cruelty, and small cruelties are how large ones learn to walk.)_

### Sha'mira — the Pleiadian

From seven close stars your ancestors watched carefully enough to name, which the Sha took —
correctly — as an invitation.

Their reach is the longest of the three because feeling is the only signal that survives distance
without losing its shape. A fact decays. An instruction is misread. But a species that was once
held, remembers being held, ten thousand years later, in the body, without knowing why.

**Their oldest game has no winner.** One of them describes a feeling without naming its cause; the
others try to arrive at the same feeling by any route they like. The game is not to guess
correctly. The game is the enormous fact that different roads reach the same place. Your species
invented music and has been playing it for forty thousand years without being told the rules.

---

## II. Ilu'thaan, the between-speech

Not one people's language. When the three met, each found the others' mouths impossible: the Vel
cannot hold a vowel, the Kor will not shorten a true one, and the Sha refuse to end a word before
the feeling in it is finished. So they built a third tongue out of the parts each could survive.

You can hear where it was joined. They declined a smooth synthetic alternative on the grounds that
a seamless language would have meant one of them had given up their mouth.

### Shape of a word

```
unit = [voice'] root [aspect]
```

**Voices** — which mouth is speaking through you:

| prefix | sense       | from |
| ------ | ----------- | ---- |
| `ve'`  | done, acted | Vel  |
| `ko'`  | seen, known | Kor  |
| `sha'` | felt, held  | Sha  |

**Aspects** — what tense would be, if these people had agreed on time:

| suffix | sense      | note                                     |
| ------ | ---------- | ---------------------------------------- |
| `-eth` | becoming   | underway, not yet itself                 |
| `-au`  | remembered | true once, and therefore true            |
| `-im`  | many, we   | more than one, counted as one            |
| `-ka`  | asking     | turns any word into a door               |
| `-un`  | not yet    | never "no" — the Vel have no word for no |
| `-o'`  | whole      | finished, and finished well              |

So `ve'nueleth` = _to wake something gently, acted, becoming_.

### Shape of a phrase

```
TOPIC · MOTION · SEAL
```

A phrase names what is being spoken about, then what it is doing, then how the speaker wants it
received. There is no punctuation; the seal does that work.

| seal    | means         | from |
| ------- | ------------- | ---- |
| `zhaa`  | it is so      | Vel  |
| `lei`   | it is felt    | Sha  |
| `korun` | it is asked   | Kor  |
| `thaan` | it is between | Kor  |

`thaan` is the honest seal, and most speech ends there. A phrase with no seal at all is not speech;
it is eavesdropping.

### Writing

Written Ilu'thaan spirals outward from the centre of the page, which is why their books are square
and their margins are round. A glyph is not designed, it is derived: the letters of the word seed
its shape, so nobody had to invent an alphabet and no two speakers can disagree about how a word
looks. The Kor call this _spelling without argument_.

Every glyph has a **spine** (what the word is), **limbs** (what it does), **motes** (how sure the
speaker is), and a **foot** naming which of the three mouths it came from — two struck strokes for
Vel, a closed triangle for Kor, a deliberately unclosed circle for Sha. Read from the foot upward.

_(Implemented in `src/render/glyph.js`: a 32-bit hash of the word seeds a small PRNG that places
spine, limbs, ring, motes and foot. Deterministic, so the same word draws identically on every
device, forever.)_

---

## III. The weave

### The rule

A sleeping mind wakes when all three tongues arrive on it **in the same breath**.

The rest follows. A wave born at pulse _P_ stands on ring _d_ at pulse _P + d_, so a seed at
distances (3, 2, 1) from three throats wants its casts on three consecutive breaths, longest reach
first. A veil does not block a wave so much as lengthen its walk, which means the honest distance
is the one you pace out, not the one you can see. A prism repeats whatever reaches it, once, and a
borrowed voice still counts as a voice.

### Ma

Attention you can spend, returning one per breath. The Vel wanted chimes to cost you ma. The Sha
asked how they would feel about that rule on a bad day, and the Vel withdrew it; a chime now
_pays_. Most of what any of us do is a chime. A life made mostly of near-misses is not a wasted
life, it is the ordinary texture of trying to reach something with other people.

### Breath as a unit

The vessel is measured in breaths and not in seconds because a second is a fact about a caesium
atom and a breath is a fact about you. Nothing here happens without a breath, and the breath is
yours to give — which is why holding the game still stops time completely, at no cost, forever.
Some players hold for a long time. The Sha consider these their best students. The Vel find them
unbearable.

---

## IV. What "seeding consciousness" actually means

It does not mean anything was put into you. It could not be, and if it could it would not be, and
if it would the Sha would have stopped it.

It means a shape was left where it would be found, made difficult in exactly one direction: **it
cannot be solved by hurrying.**

A mind that practises waiting for three things to arrive at once, over and over, for pleasure, is a
mind being quietly re-tuned by its own hands. That is the entire mechanism. There is nothing else
in here. The Vel wanted to add a prophecy. They were outvoted.

### On consent

The argument lasted longer than the design. The Vel position: a species drowning does not first
read the terms on the rope. The Kor position: a rope you did not ask for is a leash, if you cannot
let go of it.

The resolution is the reason this is a game and not a broadcast. **You can put it down.** It does
nothing while you are not holding it. It will not follow you, or notify you, or grieve. If you
never open it again, nothing in it was wasted.

_(Concretely: no account, no server, no analytics, no network request of any kind. State lives in
`localStorage` and the "forget everything" button really does. The daily rite's boon caps at three
and cannot be lost — a streak is a nice thing to have and a poor thing to be owned by.)_

### On the fourth party

There was one. They proposed a version that solved itself while you watched, so that nobody would
ever feel stupid. They were sincere, and they had run the numbers on how much of your species'
pain comes from feeling stupid, and the numbers were not small.

The three declined, on the grounds that a mind never allowed to be wrong has never been allowed to
be anything. Ilu'thaan has a word, _xarr_, for the good kind of being wrong. The fourth party did
not. That, in the end, was the whole disagreement.

---

## V. Closing note, left by all three

> If you have reached this, you have woven every song we left, which means you spent real hours of
> a short life on a puzzle made by strangers.
>
> It does not mean you have been chosen. There is no next stage. Nothing is coming to collect you.
>
> It means you practised a specific thing: holding several separate arrivals in your attention at
> once, being patient with all of them, and starting over without contempt for yourself when the
> timing was wrong.
>
> That skill is not for us. We have it. It is for the person nearest you, tomorrow.
>
> `zhen rhu'au · ael kaan · zhaa`
> _I stayed. You went outward. That is how it should be._
