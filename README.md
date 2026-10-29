# Puppy Pals: kawaii dog breed gallery

Open `index.html` directly. There's no build step and no dependencies.

* **76 breeds** from 31 countries on every inhabited continent, including 13 terriers and five pups from Japan (Shiba, Akita, Japanese Chin, Japanese Spitz and Kai Ken), all drawn by one parametric SVG generator (`dogs.js`). Each breed has a `region` (Europe, Asia, Africa, Americas, Oceania).
* **Search** by name, origin, group or temperament (press `/` to focus it), with **size**, **group** and **region** filter chips (multi-select), sorting, and a "clear filters" button. Filter state lives in the URL (`?q=&size=&group=&sort=`) and `#breed-id` opens a breed directly.
* **Favorites**: tap the ♡ on any card (or in the detail dialog, or press `F` there) to save a pup. Favorites are kept in `localStorage`, and the **♥ Favorites** toggle shows only them (`?fav=1`).
* **Guess the Pup quiz**: tap the 🎀 button under the title for 10 rounds of "which breed is this?" with four choices (tricky look-alikes of the same size or group). Answer by tapping or with keys `1`–`4`; your best score is saved in `localStorage`. Turn on 🌑 **Shadow mode** (or press `H`) to guess from a silhouette that pops into colour when you answer; it has its own best score.
* **Pup Scramble** (`scramble.js`): tap the 🔤 button to unscramble 6 short pup names from letter tiles, with a clue for each. Tap or type letters, ⌫/Backspace undoes, 💡 Hint (or `?`) adds the next right letter. Pups spelled without hints earn a ⭐, and your best round is saved in `localStorage`.
* **Pup Pairs memory game** (`pairs.js`): tap the 🧩 button to flip 12 cards and find 6 matching pups. Matches bark and stay face up, mismatches peek for a moment (or flip back as soon as you tap another card). Arrow keys and Enter work too, and your fewest moves is saved in `localStorage`.
* **Peekaboo Pups** (`peekaboo.js`): tap the 🌷 button and boop pups as they peek out of nine flower bushes for 25 seconds (tap or press `1`–`9`). Pups are +1, a golden ⭐ pup is +3, and booping the 🐝 costs a point. Your best score is saved in `localStorage`.
* **Which pup are you?** (`match.js`): tap the 🔮 button for six cute personality questions (the last one is a dream trip that picks a region), and the breed that matches your answers best (by traits, group, size and origin) pops up in its outfit. **Meet them 🐾** opens that pup; your last match is saved in `localStorage`. Keys `1`–`4` answer.
* **Size up** (`compare.js`): tap the ⚖️ button to put any two pups side by side, drawn to scale by weight, with a cute "weighs about 21× as much" verdict and a stats table. ⇄ (or `X`) swaps, 🎲 (or `R`) picks a random pair, and tapping a pup opens it. The last pair is saved in `localStorage`.
* **Treat Catch** (`catch.js`): tap the 🦴 button and move a pup left and right for 30 seconds to catch falling treats (🦴🍖 +1, 🍡 +2, ⭐ +3) while dodging 🍫 and 🍇, which aren't safe for dogs and cost a heart. Drag, hold the ◀ ▶ buttons on phones, or use ←/→ and A/D. Your best score is saved in `localStorage`.
* **Bark Along** (`bark.js`): tap the 🎵 button and four pups (toy, small, large and giant, each with its own bark) sing a tune for you to tap back in the same order. Every round adds a bark. Tap or press `1`–`4`; your best streak is saved in `localStorage`.
* **Pups around the world** (`world.js`): tap the 🌍 button to explore all 76 pups by the 31 countries they come from. Each country has its flag, a hello in its own language ("Konnichiwa!", "Bonjour!") and how many of its pups you've met, with a ✓ when you've met them all. Tap a flag or use ←/→ to travel, ✈️ **Surprise trip** (or `R`) jumps to a country with pups you haven't met yet, and tapping a pup opens it. The last country is saved in `localStorage`.
* **Where's my home?** (`home.js`): tap the 🧭 button for 8 rounds of "which country does this pup come from?", picking from four flags (one tricky neighbour from the same part of the world). Each round's pup is from a different country, a right answer says hello in that country's language ("G'day!", "Konnichiwa!"), and every correct flag goes into your travel passport at the end. Tap or press `1`–`4`; your best score is saved in `localStorage`.
* **Odd Pup Out** (`oddpup.js`): tap the 🔍 button for 8 rounds of four pups where three share something (their group, their part of the world or their size) and one doesn't. Tap the odd one (or press `1`–`4`); every pup's group, region or size pops up so you can see why. 💡 **Hint** (or `?`) says what to look at, and pups found without a hint earn a ⭐. Rounds are checked so no other rule points at a different pup. Your best stars are saved in `localStorage`.
* **Pup Maker** (`maker.js`): tap the 🎨 button to build your own pup from the gallery's parts: ears, coat colour, markings, tail, fluff, eye colour and collar. Name it (🎲 for ideas), tap 🎲 **Surprise pup** (or `R`) for a random look, or ↺ **Start over**. It tells you which real breed your pup looks most like, and **Meet** opens that breed. Your pup is saved in `localStorage`, and its name shows on the 🎨 button.
* **Pup Puzzle** (`puzzle.js`): tap the 🖼️ button and a pup picture (usually one you've met) is cut into tiles and mixed up. Tap a tile, then tap another to swap them, until the pup is whole again and you find out who it is. Pick 🐣 **Easy 3×3** or 🦊 **Tricky 4×4**, tap 👀 **Peek** (or `P`) to see the whole picture for a moment, and use arrow keys + Enter on a laptop. Tiles in the right place get a green edge, solving it the fewest possible way gets a 🏆, and your fewest moves for each size is saved in `localStorage`.
* **Trophy shelf** (`trophies.js`): tap the 🏆 button to see 13 badges you earn by meeting pups, giving pets, dressing up, naming and playing the games. Locked ones show your progress, tapping one takes you to the game that earns it, and new trophies pop up with a toast.
* **Pup Passport**: every pup you open earns a paw stamp on its card and fills a "met N of 76" progress bar, with a ✨ New friend! badge, milestone toasts and a 👑 when you've met them all. **Meet a new pup 🎲** opens a random breed you haven't met yet. Saved in `localStorage`.
* **Visit streak** (`streak.js`): the passport card counts the days in a row you visit, with seven paw prints per week, a saved best, and milestone toasts at 3, 7, 14 and 30 days. Saved in `localStorage`.
* **Give pets**: tap 🤚 **Give pets** in a pup's dialog (or press `P`) for floating hearts, a happy wiggle and a little "hehe". Each pup remembers its pets, and at 10 you become best friends.
* **Snack time**: tap 🦴 **Treat** in a pup's dialog (or press `K`) to offer dog-safe snacks. Every pup has a secret favourite; keep trying new snacks until you find it (six tries at most). Saved per pup in `localStorage`.
* **Bath time**: tap 🛁 **Bath** in a pup's dialog (or press `B`) for floating bubbles and a wet-dog shake-off. Each pup counts its baths, and at 5 it's squeaky clean. Saved in `localStorage`.
* **Nap time**: tap 💤 **Nap** in a pup's dialog (or press `Z`) and it settles in for a cosy snooze with floating Zzz and a soft snore. Each pup counts its naps, and at 5 it's well rested. Saved in `localStorage`.
* **Read aloud**: tap 🗣️ **Read aloud** under a pup's fun fact (or press `R`) and your browser's voice reads its name, nickname, home, traits, size and fun fact. Tap again (or `R`) to stop; it also stops when you move to another pup or close the card. Hidden on browsers without speech.
* **Fetch**: tap 🎾 **Fetch** in a pup's dialog (or press `G`) to throw a toy that bounces across while the pup hops after it and brings it back, with a squeak and a happy bark. Each pup counts its fetches, and at 5 it's a fetch champ. Saved in `localStorage`.
* **Pup tricks**: tap 🎪 **Trick** in a pup's dialog (or press `T`) to teach it Sit, Shake paw, Spin, Jump and Roll over, each with its own animation. Once it knows all five, it shows off a random one. Saved in `localStorage`.
* **Friendship hearts**: every pup's card has a 💞 Friendship meter with five hearts, from "Just met" to "Best friends forever". Pets, treats (plus a bonus for finding its favourite snack), baths, a favorite heart, a nickname and an outfit all add up, and each new heart gets a little glow and a cheer.
* **Dress up**: in a pup's dialog, pick a collar and a bow colour (or none), tap **🎲 Surprise outfit** (or press `D`) for a random look, or **✨ Classic** to go back. Each pup keeps its outfit in `localStorage`, and it shows on its gallery card too.
* **Nicknames**: type your own name for any pup in its dialog (press `N` there), or tap 🎲 for a cute idea like Mochi or Dango. The name shows as a ✏️ tag on its card, works in search, and appears on its sticker. Saved per pup in `localStorage`.
* **Pup stickers** (`sticker.js`): tap 📸 **Sticker** in a pup's dialog (or press `S`) to save a cute PNG card of that pup in its outfit, with its name, traits and pet count. Laptops download it; phones that can share files open the share sheet.
* **Share a pup**: tap 🔗 **Share** in a pup's dialog (or press `L`) to copy a link that opens straight to that pup; phones get the share sheet with a cute message (and your nickname). Pasting a pup link into an open tab opens it too.
* **Pup of the Day**: a card under the title features a different breed each day (based on the date); tap **Say hi 👋** to open it.
* **Night mode** (`theme.js`): tap 🌙 (or press `T`) for a cosy starry dark theme, ☀️ to go back. It follows your device's light/dark setting until you choose, and your choice is remembered.
* **Cute sounds** (`sounds.js`, Web Audio, no files): each pup barks in its own voice when opened (tiny pups yip, giants woof), plus heart, quiz and fanfare sounds. Toggle with the 🔊 button or `M`; the choice is remembered.
* **Works offline and installs like an app**: on the live page, a service worker (`sw.js`) caches everything after your first visit, and the web app manifest lets you add Puppy Pals to your home screen with its own shiba icon. (Offline mode needs http(s); opening the file directly still works, just without the cache.)
* **Pups like me**: every pup's card ends with a 👯 row of three cousins that share its group, home country or region, size or traits, each with a little reason ("Also a Terrier pup", "Also from Asia") and a new! badge for pups you haven't met. Tap one to hop straight to it, even when filters are on.
* Click a card for a detail dialog with group, size, weight, lifespan, traits and a fun fact. Use ←/→ or Prev/Next to browse.

## Adding a breed
Add an entry to `breeds.js` with `id`, `name`, `origin`, `group`, `region`, `size`, `weight`, `life`, three `traits` and a `fact` (add its country to `world.js` if it is new). Its `look` object combines shared parts:

| key | options |
|---|---|
| `pose` | `sit`, `long` (dachshund/corgi/basset) |
| `head` | `round`, `wide`, `long`, `apple`; `headScale`, `build` (body width) |
| `ears` | `pointy`, `huge`, `bat`, `tiny`, `floppy`, `long`, `fold`, `rose`, `poodle`, `butterfly`, `none`; `earSize`, `earColor`, `earFeather` |
| `muzzle` | `short`, `medium`, `long`; `muzzleColor`, `jowls`, `beard`, `wrinkles`, `tooth`, `tongue` (`true` for pink, or a colour like the Chow's blue-black), `smile` |
| `tail` | `curl`, `plume`, `otter`, `whip`, `flag`, `pom`, `stub`, `none`; `tailColor`, `tailTip` |
| `fluff` | 0 smooth · 1 ruff · 2 fluffy head · 3 cotton ball |
| `coat` | `base`, `head`, `body`, `light`, `second`, `tan` colours |
| `marks` | `blaze`, `wideBlaze`, `urajiro`, `huskyMask`, `tanPoints`, `saddle`, `cap`, `chest`, `socks`, `lowerLight`, `eyeMasks`, `patchL/R`, `sideFace`, `darkEars`, `bodySecond`, `spots`, `merle` |
| `eyes` | `size`, `color`, `left` (odd-eyed), `droopy`, `brows`, `ring` |
| extras | `silky` (long hair curtains), `topknot`, `bow`, `collar`, `barrel` |

Dark faces get an automatic eye ring so the eyes stay readable.

## Scripts (Node)
* `node export-svgs.js` writes standalone files to `svg/<id>.svg`.
* `node make-icons.js` redraws the app icons in `icons/` (needs Chrome + puppeteer-core).
* `node sheet.js` writes `sheet.html`, a contact sheet of every breed.
* `node test.js` validates the data and every SVG, then runs a headless UI test (needs Chrome; run `npm install` once to get puppeteer-core).
