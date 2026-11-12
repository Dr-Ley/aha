# Tourism Data and AHA Website Publishing Readiness Audit

**Scope:** African Home Adventure (AHA) public website content on the existing Enzi schema.  
**Database:** Supabase Postgres, read-only `SELECT`s at `2026-11-05T10:20:27Z`.  
**Code reviewed:** `frontend/src/lib/schema.ts`, `frontend/drizzle/0024_sprint6_tourism.sql`, `frontend/drizzle/0025_sprint7_itineraries.sql`, `frontend/src/server/database/ensure-sprint7.ts`, `frontend/src/server/services/itinerary/pricing.ts`, `frontend/src/server/services/itinerary/retrieval.ts`, public pages under `frontend/src/app`, and seed files under `frontend/src/features/tourism/`.  
**Not done:** no inserts, updates, deletes, migrations, or page publishes.

This audit distinguishes **verified facts** (rows and code paths) from **recommendations**. Prices below are the numbers stored today. They are not a confirmation that those numbers are current supplier or KWS tariffs.

Guest names, emails, phones, supplier contact details, vehicle registrations, and guide names are omitted.

## How to read a status

| Status | Meaning in this audit |
|---|---|
| READY | Complete, consistent, and suitable to publish as-is |
| READY WITH LIMITATIONS | Safe to show as descriptive content, with a stated limit (usually “do not show a guaranteed price”) |
| INCOMPLETE | Required content or a required relationship is missing |
| NEEDS VERIFICATION | The row exists, but accuracy, validity, or the selling-price basis is not established |
| BLOCKED | A conflicting value, broken reference, or ownership problem must be fixed before the item is published |
| NOT APPLICABLE | The row belongs to another company and is not an AHA website object |

**Strict READY count is 0.** Nothing in the tourism catalog has a verified validity window, a recorded source, and a single unambiguous public price.

## Executive summary

AHA cannot launch a priced safari website on the current data. It can consider six short destination pages as descriptive pages only.

The live store is Supabase Postgres. The public site does not read the Mongo dump or `frontend/src/lib/data.ts` at request time. It reads:

- `destinations` where `published = true` for `/destinations/[slug]`
- `attractions` for the highlights on that page
- `tours` where `company_id = 'aha'` for `/tours` (`frontend/src/components/tour-filters.tsx` calls `/api/tours?companyId=aha`)
- `accommodations` where `company_id = 'aha'` for lodge cards (`accommodation-filters.tsx`)
- `itineraries` only as a private, noindex quote at `/itineraries/[token]`

Companies in `companies`: `aha` (African Home Adventure), `ewc` (Enchoro Wildlife Camp), `bth` (Bondo Travellers Hotel). Destinations and attractions are shared (no `company_id`). Almost every priced product is company-scoped. Partner lodges live in `properties` with `company_id` null. They do not appear on the website unless a matching `accommodations` row exists. Only two such rows exist.

### Record counts

| Outcome | Records |
|---|---:|
| READY | 0 |
| READY WITH LIMITATIONS | 29 |
| INCOMPLETE | 42 |
| NEEDS VERIFICATION | 49 |
| BLOCKED | 21 |
| NOT APPLICABLE to the AHA site | 3 |

### Main risks

1. **Nineteen tour prices are already public.** `tours` has no `published` column. Every AHA tour, including its `price` and any `original_price` discount, is returned to the website.
2. **The number on a lodge card is not the Enchoro rate card.** `accommodations.price_from` for Enchoro is `100`. The itinerary engine treats that as USD per adult per night and charges children 75% in code. `room_type_rates` for `ewc` is a 2026 full-board occupancy card (single/double/triple/extra adult, resident KES and non-resident USD, high and low). The website does not read that card.
3. **Fourteen lodging properties are invisible to the site and to the pricing engine.** Thirteen partner properties and the BTH hotel have no `accommodations` row. The engine loads `accommodations` only (`retrieval.ts`).
4. **Conflicting sellable prices.** Two Maasai Mara balloon activities, two village-visit activities, and two Nairobi–Mara transfers. Lake Nakuru park fee is `90` USD in `park_fee_rates.id = 4` and `60` USD in `frontend/src/features/tourism/itinerary-catalog-data.ts`.
5. **Park fees have no source, no validity dates, and no resident/non-resident row.** The unique key is `(company_id, destination_id)`. A second visitor category cannot be stored. The season function `parkSeasonForDate` marks July–December high for every park.
6. **Tour review counts are not reviews.** `tours.review_count` ranges from 19 to 89. `testimonials` has 3 AHA rows. Five tours also show a higher `original_price`, which the card renders as a discount.
7. **Five generated or edited itineraries are not packages.** Two point at accommodation ids `15` and `19`, which are not in `accommodations`. Eighteen drafts have no plan. The public itinerary route is `noindex`.

## Data inventory

Counts are exact row counts from Supabase. Status columns are this audit’s judgement. They sum to “Records found” together with the Not applicable column.

| Category | Actual table / source | Records | Ready | Ready with limitations | Incomplete | Needs verification | Blocked | Not applicable |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| Destinations | `destinations` | 13 | 0 | 6 | 7 | 0 | 0 | 0 |
| Attractions | `attractions` | 23 | 0 | 17 | 0 | 0 | 6 | 0 |
| Accommodation properties | `properties` (+ `accommodation_providers`) | 16 | 0 | 0 | 13 | 2 | 0 | 1 |
| Accommodation rates | `room_type_rates` | 16 | 0 | 0 | 0 | 16 | 0 | 0 |
| Public lodge cards | `accommodations` | 2 | 0 | 0 | 0 | 2 | 0 | 0 |
| Activities | `activity_offerings` | 16 | 0 | 6 | 0 | 6 | 4 | 0 |
| Transport options | `transport_options` | 4 | 0 | 0 | 0 | 3 | 0 | 1 |
| Fleet vehicles | `vehicles` | 3 | 0 | 0 | 3 | 0 | 0 | 0 |
| Transfers | `transfer_options` | 3 | 0 | 0 | 0 | 1 | 2 | 0 |
| Park fees | `park_fee_rates` | 8 | 0 | 0 | 0 | 6 | 1 | 1 |
| Safari packages | `tours` | 19 | 0 | 0 | 0 | 13 | 6 | 0 |
| Itineraries | `itineraries` | 23 | 0 | 0 | 19 | 2 | 2 | 0 |

Related operational tables, not public catalog pages: `rooms` 74 (BTH 32, EWC 42, AHA 0), `room_types` 17 (BTH 7, EWC 10, AHA 0), `guides` 1 active AHA employee, `vehicle_providers` 1, `itinerary_components` 19, `itinerary_versions` 37, `itinerary_generation_logs` 41. There is no separate activities, images, or seasons table beyond the columns named above.

### Where data lives

| Store | Role today |
|---|---|
| Supabase `public` tables above | Source of truth for the website and the itinerary engine |
| `frontend/public/*.png` | Image files. Local paths referenced by the two lodge cards and by tour heroes resolve on disk, except two tours that use `i.pinimg.com` URLs |
| `frontend/src/features/tourism/destinations-data.ts` and `itinerary-catalog-data.ts` | Seed input. Not read by the public pages. Lake Nakuru’s seed fee disagrees with the live row |
| `frontend/src/lib/data.ts` | Type shapes and seed content. Public tour and lodge lists come from the database |
| `frontend/src/lib/enchoro-rates-2026.ts` | Hard-coded 2026 Enchoro occupancy card and the July–December park-season rule. The 16 `room_type_rates` rows match this file |
| `migrat/aha-neon-db-mongodb/` | Historical export. Not the live store |
| `docs/local-mongodb.md` | Local Mongo notes. Not used by the current Next.js data path (`frontend/src/lib/db.ts` is Postgres) |

### Company rules that the code actually applies

- Shared reference data: `destinations`, `attractions`. Any tenant can point at them.
- AHA public catalog: `tours.company_id = 'aha'`, `accommodations.company_id = 'aha'`.
- Pricing catalog for an AHA itinerary: `park_fee_rates`, `activity_offerings`, `transfer_options`, and `transport_options` filtered to the itinerary’s `company_id` (`retrieval.ts`). The EWC vehicle row and the EWC Mara park-fee row are not loaded for an AHA quote.
- Tenant lodging: `accommodation_providers.type = 'tenant'` with `company_id` set. That is EWC (`provider id 1`, `properties.id 1`) and BTH (`provider id 2`, `properties.id 2`).
- Partner lodging: `type = 'partner'` and `properties.company_id` null. Schema comment in `schema.ts`: partner rows stay AHA-managed until they become a shared Enzi resource. The website still will not list them until an `accommodations` row exists. EWC ownership is not implied availability for AHA. Availability for the public site is the AHA `accommodations` row, which does exist for Enchoro (`accommodations.id 11` → `properties.id 1`). The rate card under that property remains `company_id = 'ewc'`.

### Publication fields that exist

| Object | Publish / SEO fields in the live database |
|---|---|
| `destinations` | `published`, `seo_title`, `meta_description`, `canonical_path`, `slug`, `image`, `description`. These columns are in `schema.ts` and in the live table. The original `0024` migration created the table without them; `ensure-sprint7.ts` adds them at runtime |
| `tours` | `slug` only. No `published`, SEO title, or canonical column. Presence in the table is publication |
| `accommodations` | `slug` only. Same behaviour |
| `attractions`, `activity_offerings`, `properties` | No publish flag, no SEO fields, no image column on attractions or properties |
| `itineraries` | No publish flag. Public URL is the unguessed `public_token`. The page sets `robots: { index: false }` |

`/destinations/[slug]` returns 404 unless `published` is true. It renders country, region, name, description, and attraction names. It does **not** render `image`, lodges, fees, or activities.

Sitemap (`frontend/src/app/sitemap.ts`) emits every published destination and every AHA tour slug.

## Record-level findings by destination

Spelling in the database is **Maasai** on `destinations.name`. Tour titles and several property locations use **Masai**. That is an inconsistency, not two destinations. Slugs are unique. No duplicate destination names.

### Maasai Mara — `destinations.id 1`, slug `maasai-mara` — READY WITH LIMITATIONS

Published. Region `Narok County / Rift Valley`. Description 158 characters. SEO title, meta description, and canonical `/destinations/maasai-mara` are set. Image column is `/destination_maasai_mara1.png` (file exists) and is the same path stored on every other published destination. The destination page does not display it.

| Linked data | What exists | Status |
|---|---|---|
| Attractions | ids 2 Game drive, 3 Maasai village visit, 4 Hot air balloon safari, 14 Maasai Mara National Reserve, 15 Great Wildebeest Migration, 16 Maasai Village (Manyatta) Visit, 17 Hot Air Balloon Safari, 18 Guided Nature Walk | Village and balloon each exist twice. Those four rows are BLOCKED as a set |
| Activities (`aha`) | 1 Shared game drive $0, 2 balloon $450/$350, 3 village $30/$15, 10 walk $20/$20, 11 village $25/$25, 12 balloon $450/$450 | Zero-price drive is a limitation. Balloon and village pairs conflict |
| Public lodge card | `accommodations.id 11` Enchoro, `price_from` 100, 9 images, destination 1, property 1, provider 1 (EWC tenant) | NEEDS VERIFICATION. Card says “From” per night. Engine multiplies by adults |
| Properties not on the card | 38 Masai Mara Sopa Lodge, 40 Zebra Plains Mara Camp | INCOMPLETE for the website: descriptions exist, no rates, no images, no `accommodations` row |
| EWC rate card | `room_type_rates` ids 1–16, all `room_type_id` null, year 2026, full board | Matches `enchoro-rates-2026.ts`. Not what the AHA card or itinerary engine uses |
| Park fee | AHA `park_fee_rates.id 2`: non-resident high 200/100, low 100/50, resident KES 5000/2500. EWC id 14 duplicates the same figures | NEEDS VERIFICATION. No source or validity dates. Unique key blocks a second AHA row |
| Transfers | id 2 Nairobi–Mara $180 landcruiser; id 3 Nairobi/JKIA–Enchoro $200 “4x4 Land Cruiser” | BLOCKED until one canonical transfer is chosen |
| Transport | AHA options 1 Land Cruiser $230 / 7 seats, 2 van $120 / 8 seats, 3 private Land Cruiser $250 / 6 seats. Fleet vehicles 1–3 are AHA-owned, no public description | Options NEEDS VERIFICATION. Fleet INCOMPLETE for advertising. Option 1 and EWC option 4 are both $230 and are not linked |
| Packages | Many `tours` rows name Masai Mara. None reference `destinations.id` | See package section. Prices unverified |
| Itineraries | ids 2 and 19 use destination 1 and accommodation 11 | 19 reproduces today’s engine total of 2010. 2 stores 990, which does not |

Missing for a priced Mara page: one canonical balloon price, one village price, one Nairobi–Mara transfer, a selling rate that states per person or per room, child rule, and a fee source with a date. No coordinates on the property (`details` has check-in, check-out, distance from gate only).

### Amboseli — `destinations.id 2`, slug `amboseli` — READY WITH LIMITATIONS

Published. Region Kajiado. Description, SEO, and canonical are set. Same shared image path.

Attractions 5 Elephant herds, 6 Observation Hill. Activities 4 Observation Hill $0, 5 Amboseli game drive $0. Park fee id 3: 60/30 USD, and the low-season columns are also 60/30, so the season flag does not change the price. KES columns are null.

Property 45 Nyati Safari Camp (Kimana Gate, partner Nyati Safari Camp) has a description and is **not** in `accommodations`. No Amboseli lodge card. No Amboseli room rates. No Amboseli transfer. Itinerary 20 is a 3-day Amboseli plan with `accommodationId` null; its stored cost 590 matches transport + JKIA–Nairobi transfer + three days of the $60 fee, and it still has no lodge.

### Lake Nakuru — `destinations.id 3`, slug `lake-nakuru` — READY WITH LIMITATIONS

Published. Description, SEO, and canonical are set.

Attraction 7 (flamingos and rhinos) and 63 (rhino sanctuary and bird watching). Activity 6 “Lake Nakuru game drive” at $0, not linked to an attraction.

Public card: `accommodations.id 13` Sarova Lion Hill Game Lodge, `price_from` 320, type lodge, badges include Luxury, 5 local images, property 3, provider 3. **No `room_type_rates` for Sarova or for company `aha`.** 320 has no occupancy, meal plan, or date.

Other properties, all absent from `accommodations`: 33 City Max Hotel, 39 Lake Nakuru Sopa Lodge, 43 Eagle Palace Hotel. Descriptions exist. Amenities are empty on City Max. No coordinates.

Park fee id 4 is named “Lake Nakuru National Park Entry Fee (Non-Resident)” at **90 / 45 USD**. The seed file still says **60 / 30**. Low-season columns equal the high-season columns. KES is null, so a resident price cannot be quoted. This fee is BLOCKED until AHA confirms one figure.

### Lake Naivasha — `destinations.id 4`, slug `lake-naivasha` — INCOMPLETE

`published = false`. Description, image, SEO title, meta description, and canonical are empty.

Attractions: 8 Lake Naivasha boat ride, 64 Hell’s Gate National Park, 65 Crescent Island, 66 a second Lake Naivasha Boat Ride. Rows 8 and 66 are duplicate concepts.

Activities: 17 Crescent Island Entry 33/16, 18 boat 20/20. No game-drive product. Park fee id 13 is “Hell’s Gate National Park Entry Fee (Non-Resident)” 50/25, attached to the Naivasha destination, not to a Hell’s Gate destination. There is no separate Naivasha conservancy fee.

Properties 34 Leisure Apex Hotel and 44 Dove Nest Lodge have descriptions and no rates, images, or public cards.

Do not publish `/destinations/lake-naivasha`.

### Tsavo West — `destinations.id 5` — READY WITH LIMITATIONS

Published, short description, SEO and canonical set, shared image. Attraction 9 Mzima Springs. Activity 9 Mzima Springs visit at $0. Park fee id 6 at 60/30 with low season equal to high. **No property, no lodge card, no transfer, no room rates.** Itinerary 4 points at accommodation id 19, which does not exist.

### Tsavo East — `destinations.id 6` — READY WITH LIMITATIONS

Published, short description, SEO and canonical set, shared image. Attraction 10 Red elephants of Tsavo. Activity 8 game drive at $0. Park fee id 5 at 60/30. **No property and no lodge card.** The seed file names Ashnil Aruba; that property is not in `properties`.

### Nairobi — `destinations.id 7` — READY WITH LIMITATIONS

Published as the safari gateway. Description, SEO, and canonical set. Shared Mara image path, not shown on the page.

Attractions 67 David Sheldrick Wildlife Trust, 68 Giraffe Centre. No Nairobi National Park attraction row, although activity 7 is “Nairobi National Park game drive” at 40/20 with `attraction_id` null.

Activities 19 Sheldrick 20/5 and 20 Giraffe Centre 15/8. These read as entry amounts, not AHA-operated activities, and have no source.

Property 35 Villa Leone Boutique Hotel (Gigiri) is not on the public card. No Nairobi room rates.

Park fee id 1 “Nairobi National Park fee” 50/25, low season stored as the same 50/25. Transfer id 1 JKIA–Nairobi hotel $50 safari van.

### Unpublished destinations — INCOMPLETE

| Id | Slug | Country / region | Attractions | Properties | Fees, activities, public copy |
|---:|---|---|---|---|---|
| 8 | `serengeti` | Tanzania / Mara | 11 Serengeti endless plains | 37 Angata Serengeti Camp | None |
| 9 | `ngorongoro` | Tanzania / Arusha | 12 Ngorongoro Crater descent | 36 Angata Ngorongoro Camp | None |
| 10 | `lake-manyara` | Tanzania / Arusha | 13 Lake Manyara game drive | None | None |
| 11 | `arusha` | Tanzania / Arusha | None | None | None |
| 12 | `diani` | Kenya / Kwale | None | 41 Baobab Beach Resort | None. No beach-fee row |
| 13 | `ol-pejeta` | Kenya / Laikipia | None | 42 Sweetwaters Serena Camp | None |

All seven have empty description, image, SEO, and canonical, and `published = false`. Partner camps have description text and amenity lists in `properties.details` / `amenities`, and still have no rates or public cards.

### Bondo Travellers Hotel — NOT APPLICABLE

`properties.id 2`, provider 2, `company_id = 'bth'`, location “Bondo, Kenya”, `destination_id` null. Room types 1 and 136–141 with `base_rate` integers (1000–8000) and **no** `room_type_rates` rows. Rooms are BTH hotel inventory. This is not an AHA safari property and must not be treated as one. The missing destination link should be fixed only if BTH is later modelled as a destination stay.

## Category notes

### Attractions

23 rows, all with a real `destination_id`, a type, a duration, and a description. No image column and no visibility flag. Orphan foreign keys: 0.

BLOCKED duplicates:

| Ids | Problem |
|---|---|
| 3 and 16 | Two Maasai village visits on destination 1 |
| 4 and 17 | Two hot-air balloon rows on destination 1 |
| 8 and 66 | Two Lake Naivasha boat rides on destination 4 |

The other 17 can be listed as highlights. They are not their own pages.

### Accommodation

Providers: 1 EWC tenant, 2 BTH tenant, 3 and 21–31 partners (Sarova, City Max, Leisure Apex, Villa Leone, Sopa, Nyati, Zebra Plains, Eagle Palace, Angata, Baobab, Serena, Dove Nest). Contact JSON exists on some partner rows. It is not repeated here.

Public cards are only:

| Id | Slug | `price_from` | Basis stored? | Rates table |
|---:|---|---:|---|---|
| 11 | `enchoro-wildlife-camp` | 100 | No currency column. UI treats it as USD per night (“From”) | EWC occupancy card, not this column |
| 13 | `sarova-lion-hill-game-lodge` | 320 | Same | No rate rows |

`price_from` has no meal plan, occupancy, season, or validity. Child price is not a column. The itinerary engine does `adults * priceFrom + children * round(priceFrom * 0.75)` per night, and it skips the last day (`pricing.ts`). A single traveller in high season would be quoted $100 at Enchoro while the EWC card says $120 for a non-resident single on full board. A double in low season would be quoted $200 (2 × 100) while the card says $180 for the room.

EWC room types 121–128 and 142 hang off property 1. Type 129 “Standard” has `property_id` null and `base_rate` null. `base_rate` on the tent types is the resident KES figure (7500 / 14000 / 18000 / 24000), not the USD card. Family occupancy exists as a room type and is mapped in code onto triple-plus-extra-adult (`tentPricing` in `enchoro-rates-2026.ts`). There is no family row in `room_type_rates`.

No property has latitude or longitude. `has_coords` was checked against `details` keys `latitude`, `lat`, and `coordinates`.

AHA has no rooms. Hotel availability is an EWC/BTH operational feature, not an AHA website calendar.

### Activities

All 16 rows are `company_id = 'aha'`. No images, duration, inclusions, age column, or validity. Child rates are a second integer, not an age band. Attraction links that are set all resolve. Six drives and visits are stored at 0 USD (ids 1, 4, 5, 6, 8, 9). The engine drops a zero line (`if (!cost) continue`), so a “included game drive” never appears on the quote. That is acceptable only if the vehicle day rate is understood to include it. Staff must confirm that.

Priced rows that are unique but unverified: 7, 10, 17, 18, 19, 20.

BLOCKED pairs: activities 2 vs 12 (balloon child 350 vs 450) and 3 vs 11 (village 30/15 vs 25/25).

There is no public activity page. Activities are engine inputs only.

### Transport and transfers

`vehicles` (AHA-owned): ids 1 and 2 landcruiser capacity 7, available; id 3 safari van capacity 9, available. No photos, routes, or public description. Not joined to `transport_options`. The van fleet capacity (9) does not match transport option 2 (capacity 8).

`transport_options`: AHA 1–3 as priced above. EWC id 4, $230, capacity 7, is the camp vehicle from `ENCHORO_SAFARI_VEHICLE_2026`. An AHA quote will not load it. AHA option 1 is the same daily rate, so the fleet can be double-counted if someone adds both companies into one quote later.

`transfer_options` are all AHA. No per-person flag, no date, no image. The amount is a single integer. The engine adds it once per selected id, not per traveller. Ids 2 and 3 overlap (Nairobi area to Mara, $180 vs $200) and are BLOCKED as a pair. Id 1 (JKIA–Nairobi hotel, $50) is the transfer actually attached to the Mara and Amboseli itineraries that were inspected, including a plan whose destination is the Mara. That route does not deliver the guest to the park.

### Park and conservation fees

Live AHA rows:

| Id | Destination | Adult / child / infant USD | Low-season adult/child | KES adult/child |
|---:|---|---|---|---|
| 1 | Nairobi | 50 / 25 / 0 | 50 / 25 | null |
| 2 | Maasai Mara | 200 / 100 / 0 | 100 / 50 | 5000 / 2500 |
| 3 | Amboseli | 60 / 30 / 0 | 60 / 30 | null |
| 4 | Lake Nakuru | 90 / 45 / 0 | 90 / 45 | null |
| 5 | Tsavo East | 60 / 30 / 0 | 60 / 30 | null |
| 6 | Tsavo West | 60 / 30 / 0 | 60 / 30 | null |
| 13 | Lake Naivasha (Hell’s Gate label) | 50 / 25 / 0 | 50 / 25 | null |

`created_at` is September 2026 for the first six and 8 September 2026 for Hell’s Gate. That is a load timestamp, not a tariff verification date. There is no source column, no unit column (the engine assumes per person per itinerary day), and no `valid_from` / `valid_to`.

Code conflict: `validation.ts` treats ages 0–2 as infant and 3–12 as child. `MAASAI_MARA_PARK_FEES_2026` in `enchoro-rates-2026.ts` comments a non-resident child maximum of 17 and a resident child maximum of 12. The fee table cannot store both rules.

Only Mara’s low and high USD figures differ. For every other park, July–December versus January–June does not change the stored number. Missing destinations for fees: Naivasha itself (as distinct from Hell’s Gate), Diani, Ol Pejeta, Serengeti, Ngorongoro, Lake Manyara, Arusha, and any conservancy fee separate from the park gate.

EWC `park_fee_rates.id 14` repeats the AHA Mara numbers. Not used by AHA retrieval.

### Safari packages (`tours`)

19 rows, all `company_id = 'aha'`. Each has a slug, day-by-day JSON (`day`, `title`, `description` only — no destination id, property id, or activity id), inclusions, exclusions, highlights, a duration, and an integer `price`. Schema comment: `price` is the adult USD rate. `child_price` is null on 17 tours, which the schema says means the child pays the adult rate. Only tours 22 and 23 set `child_price` to half the adult figure. `infant_price` is null on all 19 (schema: null means complimentary).

`rating` is between 4.5 and 5.0 and `review_count` is between 19 and 89. Those figures are not computed from `testimonials`.

Tours 1, 2, 4, 6, and 10 also have `original_price` above `price` (for example tour 1 is 650 against an original 780). The tour card shows that as a discount. No promotion record explains it.

Two heroes are remote pinimg URLs: tour 2 and tour 4. The other first images are files under `frontend/public`.

Day titles are prose (“Nairobi to Masai Mara”). They do not prove which lodge, fee, or vehicle was used to build `price`. A fresh itinerary quote cannot be tied back to a tour id. There is no foreign key from `tours` to `destinations`.

BLOCKED for publication as a priced product because a destination they depend on is unpublished and has no fee, lodge card, or activities:

| Id | Slug | Adult USD | Why blocked |
|---:|---|---:|---|
| 4 | `6-day-serengeti-ngorongoro-masai-mara` | 1850 | Serengeti and Ngorongoro unpublished; pinimg hero |
| 6 | `8-day-kenya-tanzania-combined` | 2450 | Tanzania destinations unpublished |
| 16 | `3-day-amboseli-safari-drop-off-diani` | 670 | Diani unpublished; no Diani fee or lodge card |
| 21 | `6-day-ngorongoro-serengeti-masai-mara-mid-range-safari` | 3682 | Tanzania destinations unpublished |
| 22 | `8-day-lake-nakuru-masai-mara-diani-beach-safari` | 2132 | Diani unpublished. Only this row and tour 23 have a child price |
| 23 | `9-day-ol-pejeta-nakuru-masai-mara-naivasha-amboseli-safari` | 2150 | Ol Pejeta unpublished; no conservancy fee or lodge card |

The other 13 tours stay NEEDS VERIFICATION. They cover Maasai Mara, Amboseli, Nakuru, Naivasha, and Tsavo in prose, but the selling price has no validity date, no child rule on  the page, and no link to the catalog that would regenerate it. Tour 5 ends in Mombasa, and Mombasa is not a destination row.

### Itineraries

These are staff/guest quote documents, not marketed packages. Status mix for `company_id = 'aha'`:

| Status | Rows | Plan | Stored selling price |
|---|---:|---:|---:|
| draft | 18 | 0 | 0 |
| generated | 2 (ids 19, 20) | 2 | 2 |
| modified | 2 (ids 2, 4) | 2 | 2 |
| converted | 1 (id 1, has a booking) | 1 | 1 |

Generation log totals, all AHA: heuristic rejected 14, OpenAI failed 10, Gemini rejected 6, Gemini failed 6, heuristic accepted 5. No accepted OpenAI or Gemini run is in the log summary. A successful generation is not evidence that a page should be published. Ids 19 and 20 are heuristic products that passed validation against whatever catalog existed at the time.

| Id | Finding |
|---:|---|
| 1 | Destination 2. Accommodation id **15 is not in `accommodations`**. Stored cost 2510 / sell 3020 at 20% markup. BLOCKED |
| 4 | Destination 5, activity 9. Accommodation id **19 is not in `accommodations`**. Stored cost 3470 does not match a recompute that skips the missing lodge. BLOCKED |
| 20 | Destination 2, no accommodation on any day. Cost 590 matches van + JKIA transfer + Amboseli fee. INCOMPLETE as a safari |
| 19 | Destination 1, accommodation 11, van id 2, transfer id 1. Cost 2010 matches the current engine, including three high-season Mara fee days. The transfer product is still “JKIA – Nairobi hotel”, not the Mara road transfer. NEEDS VERIFICATION |
| 2 | Same lodging and destination as 19, one adult, Land Cruiser id 1. Stored cost **990** does not match a current-engine recompute (park fees on, last night excluded). NEEDS VERIFICATION |
| 3, 5–18, 21–23 | Draft shells with dates and party size only. INCOMPLETE |

None of these rows have SEO fields. Do not add them to the sitemap. The token page is already noindex.

`itinerary_components` for AHA are 4 accommodation, 5 transport, 5 park_fee, 5 transfer. There are no activity components, which matches the plans: most days have an empty `activityIds` array.

## Missing-data register

Priority P1 blocks a priced launch. P2 blocks a decent first destination set. P3 is needed before Tanzania, coast, or extra parks.

| P | Category | Ids | Destination | What is wrong | Why it matters | Action | Blocks publishing? |
|---|---|---|---|---|---|---|---|
| P1 | Tours | all 19 AHA rows | Several | Price is public, with no validity, no catalog link, and on five rows a discount | The live tour card shows `formatPrice(tour.price)` | Staff confirms each selling price and child rule, or the site stops showing a number | Yes, for any priced tour page |
| P1 | Lodge cards | accommodations 11, 13 | Mara, Nakuru | 100 and 320 have no occupancy, meal plan, or date. 11 disagrees with the EWC card | “From” can be read as a confirmed rate | Confirm the public basis or replace with Request a quote | Yes, for priced lodge pages |
| P1 | Activities | 2 and 12; 3 and 11 | Maasai Mara | Two balloons and two village visits with different child or adult amounts | A plan can pick either id and produce a different quote | Keep one row per product. Confirm the amount. Retire the other | Yes, for any quote that includes them |
| P1 | Transfers | 2 and 3 | Maasai Mara | $180 vs $200 for overlapping Nairobi–Mara routes | Same problem | Keep one canonical transfer. State per vehicle or per person | Yes, for Mara road pricing |
| P1 | Park fee | 4 | Lake Nakuru | Database 90/45 vs seed file 60/30 | Two sources of truth | Staff confirms the current non-resident tariff and the date it was checked. Update one place only | Yes, for Nakuru pricing |
| P1 | Itineraries | 1, 4 | Amboseli, Tsavo West | Accommodation ids 15 and 19 are missing | Quotes reference deleted catalog rows | Do not publish. Re-link or archive | Yes, if these links were ever public |
| P1 | Ownership | property 1 / accommodation 11 | Maasai Mara | EWC owns the camp and the rate card. AHA owns the public card | Easy to sell the wrong rate or imply AHA inventory | Written rule: which price AHA may display, and that rooms stay EWC inventory | Yes, before Enchoro is sold as an AHA rate |
| P2 | Destinations | 4, 8–13 | Naivasha, Tanzania, Diani, Ol Pejeta | Unpublished, no description or SEO | Pages 404. Tours already name several of them | Do not publish those tours. Write copy only after staff supplies it | Yes, for those URLs and those tours |
| P2 | Properties | 33–45 | Nakuru, Naivasha, Nairobi, Ngorongoro, Serengeti, Mara, Diani, Ol Pejeta, Amboseli | Not in `accommodations`. No rates, images, or coordinates | They cannot be shown or priced | For each property AHA will actually sell: create the card, category, images, and a dated rate, or leave it off the site | Yes, for those lodge pages |
| P2 | Rates | none for partners; EWC 1–16 unverified for AHA display | Mara | No supplier-vs-selling split. No child column. No date range. Unique key cannot store per-room-type cards | Engine cannot price a partner lodge | Enter a selling rate only after the supplier confirms it. Until then, Request a quote | Yes |
| P2 | Park fees | 1, 2, 3, 5, 6, 13 | Core parks and Hell’s Gate | No source, no validity, resident price missing except Mara KES columns | A displayed fee can be wrong | Record source and check date. Do not invent the tariff in the CMS | Yes, if the fee is shown as current |
| P2 | Images | destinations 1–3, 5–7 | Published Kenya parks | One shared Mara image path | Wrong picture if the field is later rendered | Distinct, licensed images per destination | No, for the current page, which hides the image |
| P2 | Reviews | tours 1–23 | — | `review_count` is not backed by `testimonials` (3 rows) | False social proof | Remove the counts or replace them with real testimonials | Yes, if the count stays on the card |
| P2 | Child rules | tours, activities, fees, EWC card | All | Three different child treatments (null = adult price, half price on two tours, 75% in itinerary code, fee child column, Mara comment says under 17) | Family quotes will not match the website | One written age policy, then store it | Yes, for family prices |
| P3 | Tsavo lodges | destinations 5 and 6 | Tsavo | No property rows | Cannot name a real camp | Staff supplies the camps AHA uses | Yes, for Tsavo lodge pages |
| P3 | Naivasha model | destination 4, fee 13, attractions 8 and 66 | Naivasha | Hell’s Gate fee stored on the lake. Duplicate boat ride | Quotes mix two parks | Split Hell’s Gate if it is sold separately. Delete one boat row | Yes, for Naivasha pricing |
| P3 | Fleet | vehicles 1–3 | — | No public copy, not linked to priced options. Van capacity 9 vs option capacity 8 | Internal fleet could be advertised by mistake | Decide which vehicles are public. Fix capacity | No, until a fleet page exists |
| P3 | Coordinates | all properties | All | No lat/lng | Maps cannot be honest | Add only surveyed coordinates | No |
| P3 | Itinerary drafts | 3, 5–18, 21–23 | — | No plan | Empty records | Leave as drafts. Do not expose | No |

## Pricing readiness

The itinerary engine (`quoteItineraryPlan`) can produce a number only when every selected id exists in the AHA catalog. It will still produce a **wrong** number if the catalog amount is stale or duplicated. The AI is not allowed to invent amounts. That does not make the stored amounts true.

| Component | Can the engine emit a figure? | Safe to show on the public site? |
|---|---|---|
| Accommodation | Only for accommodations 11 and 13, using `price_from` × nights × (adults + 0.75 × children), last day excluded | **No.** Use Request a quote. 11 is not the EWC occupancy card. 13 has no rate card at all |
| Activities | Yes, for a chosen `activity_offerings` id. $0 lines disappear. Duplicate ids price differently | **No**, except a clearly labelled “included in the vehicle” note after staff confirms the $0 drives. Do not show balloon or village prices until one row remains |
| Transport | Yes, `daily_rate_usd × duration days`, once per selected option | **No.** No validity and no link to the real vehicle |
| Transfers | Yes, one flat `amount_usd` per id, not per person | **No** for Mara until ids 2 and 3 are reduced to one confirmed tariff. JKIA–Nairobi hotel (id 1) may be quoted only for that route, after staff confirms $50 |
| Park fees | Yes, per person per day on the destination, July–December uses `adult_usd`, January–June uses `adult_usd_low` when set | **No.** Show Request a quote, or “park fees excluded / payable at the gate”, until each row has a source and a check date |
| Full safari package | The 19 tour prices do not come from this engine. The five itineraries that have quotes are not package pages, and two of them point at missing lodges | **No.** Request a quote on every package |

Request a quote is the correct public behaviour wherever a component is missing, duplicated, owned by EWC without an agreed selling rate, or lacking a validity date. That is the current state of every priced category.

## Website content readiness

| Page | Ready to publish? | Why |
|---|---|---|
| `/destinations/maasai-mara`, `/amboseli`, `/lake-nakuru`, `/tsavo-west`, `/tsavo-east`, `/nairobi` | Descriptive only, after a person reads the short paragraph | `published` is already true, so a production deploy would index them via the sitemap. Copy is one or two sentences from the seed. No prices on the page. Duplicate highlight names on Mara and the shared image are the limits |
| `/destinations/lake-naivasha` and the six other unpublished slugs | No | Flag is false and the copy fields are empty. Correct |
| `/tours` and `/tours/[slug]` for all 19 slugs | No | Prices, discounts, and review counts render with no verification gate |
| Category landings (`/kenya-safaris`, `/tanzania-safaris`, `/budget-safaris`, and the other static routes in `sitemap.ts`) | Only as brochure copy that does not state a tariff | They are hard-coded pages. This audit did not treat them as catalog data. They must not repeat an unverified tour price |
| Lodge cards for Enchoro and Sarova | No, while `price_from` is shown | Names and descriptions can stay on an enquiry page with the price removed |
| The 13 partner properties | No | Not in the public table |
| Activity pages | No | No such pages, and the priced rows are unverified or duplicated |
| Itinerary marketing pages | No | Token pages are quotes and are noindex. Do not add package URLs for ids 1–23 |
| BTH or EWC hotel stay pages on the AHA site | No | Different companies. EWC may be mentioned as a camp AHA uses only with the pricing rule above |

## Prioritized data-entry and verification plan

Do not type prices from memory or from this audit. Every amount below is a **confirmation task**, not a value to copy in as new truth.

### 1. Integrity first

1. Choose the surviving row in each duplicate set and archive the other: attractions 3/16, 4/17, 8/66; activities 2/12 and 3/11; transfers 2/3.
2. Decide the fate of itineraries 1 and 4 (archive or rebuild). Do not leave dangling accommodation ids 15 and 19.
3. Write down the Enchoro rule in the dashboard, not only in code: AHA may display the camp; EWC owns rooms and the 2026 card; AHA `price_from` 100 is not that card.
4. Align Lake Nakuru: either `park_fee_rates.id 4` or the seed in `itinerary-catalog-data.ts`, after a dated source, not both.
5. Stop the public API from returning a tour or lodge price until that row is marked confirmed. Today the only practical switch is “row exists”.

### 2. First destination set

Use the destinations that already have published copy. Suggested order, based on what is actually in the database:

1. **Nairobi** (gateway, transfer id 1, fee id 1, activities 7/19/20, property 35 not yet public)
2. **Maasai Mara** (richest, and the most conflicts)
3. **Amboseli**
4. **Lake Nakuru**
5. **Tsavo East and Tsavo West** together
6. **Lake Naivasha** only after the page copy exists and Hell’s Gate is either included in the description or split
7. Leave **Diani, Ol Pejeta, Serengeti, Ngorongoro, Manyara, Arusha** off the first release. Tours 4, 6, 16, 21, 22, and 23 stay unpublished until those destinations are real

For each of 1–5, staff must supply or confirm:

| Field | Nairobi | Mara | Amboseli | Nakuru | Tsavo E/W |
|---|---|---|---|---|---|
| Description beyond the current sentence | Confirm or replace the live paragraph | Same | Same | Same | Same |
| Distinct image | Required before the page shows a photo | Required | Required | Required | Required |
| Lodge AHA will name | Confirm whether Villa Leone (property 35) is sold. If not, name none | Confirm Enchoro selling basis. Sopa (38) and Zebra Plains (40) stay hidden until rated | Nyati (45) stays hidden until rated. No other Amboseli property exists | Sarova card (13) needs a real rate or the price comes off. City Max, Sopa, Eagle Palace stay hidden | No property exists. Do not invent one. Ask AHA which camp, then enter it |
| Rate | None stored | Confirm against the EWC card: occupancy, season, resident vs non-resident, child, year | None stored | None stored for 320 | None |
| Activities to keep | Confirm 40/20 park drive, Sheldrick 20/5, Giraffe 15/8 or mark them “pay locally” | One balloon, one village, one walk, and whether game drives are inside the vehicle rate | Confirm $0 hill and game drive means included | Confirm $0 game drive | Confirm $0 |
| Transfer | Confirm JKIA–hotel $50 | One Nairobi–Mara figure and the unit (vehicle) | None stored. Enter only a confirmed road or flight transfer | None stored | None stored |
| Park fee | Confirm 50/25 and whether resident KES is required | Confirm 200/100 high, 100/50 low, KES 5000/2500, and the child age | Confirm 60/30 | Resolve 90 vs 60 | Confirm 60/30 each |
| Package | Do not publish a Nairobi-only tour (none exists) | Re-price tours 1, 7, 10, 14, 17, 18 from the confirmed pieces or show Request a quote | Tours 3 and the Amboseli days inside tour 5 | Tours that include Nakuru (2, 11, 19, 20) | Tour 5 |

### 3. After the first set

Park fees and activities for Diani and Ol Pejeta, then Tanzania parks, each with a source and a date. Only then the blocked cross-border and beach tours. Images and SEO last, after the facts are stable. Canonical paths already follow `/destinations/{slug}` on the six published rows; keep that pattern.

## Technical issues for developers

These are code and schema facts. They are not a request to change them in this audit.

1. **No publish gate on `tours` or `accommodations`.** `getToursFromDb` returns every row for the company. The public client always passes `companyId=aha`.
2. **Two pricing sources for Enchoro.** Hotel stays use `room_type_rates` via the Enchoro helper. Itineraries use `accommodations.price_from`. They are not the same basis (per room occupancy vs per adult).
3. **`room_type_rates` unique key** is `(company_id, occupancy, season, guest_category, year)`. It omits `room_type_id`, `currency`, and `meal_basis`. A second room type or a second currency for the same guest category cannot be stored. Every current rate has `room_type_id` null.
4. **`park_fee_rates` unique key** is `(company_id, destination_id)`. Resident and non-resident cannot be two rows. There is no validity, source, unit, or child-age column. KES amounts exist only on the Mara rows.
5. **`parkSeasonForDate`** (`enchoro-rates-2026.ts`) treats month ≥ 7 as high for every destination. That matches the Mara comment in the same file (1 July–31 December). It is the wrong switch to reuse for lodges: the Enchoro lodge high season in that file is January–February, July–September, and December.
6. **Child age is not one rule.** Itinerary bands are infant ≤ 2 and child ≤ 12. The Mara fee comment says non-resident child to 17. Tours with null `child_price` charge the adult tour price.
7. **Partner properties are invisible** because retrieval and the public API read `accommodations`, not `properties`. Null `properties.company_id` does not by itself publish a lodge.
8. **Destination `image` is unused** by `app/destinations/[slug]/page.tsx`, and the six published rows share one path.
9. **`ensureSprint7Schema` alters the live database on read** (adds publication columns and creates pricing tables). The Drizzle migration `0024` does not contain those columns. Schema drift depends on traffic having hit that helper.
10. **Seed drift.** `PARK_FEE_SEEDS` still has Lake Nakuru at 60/30. The live row is 90/45. Re-running the seed without a check would fight production.
11. **`tours.review_count` and `original_price`** are display fields with no supporting review or promotion table.
12. **Itinerary snapshots are not recomputed on read.** Id 2’s stored cost is stale against `quoteItineraryPlan`. Id 19 still matches. Nothing marks a quote dirty when a catalog price changes.
13. **Last-day accommodation** is stored on the plan and ignored for nights. Readers of the JSON will over-count nights if they do not share that rule.
14. **Transfer on Mara plans** can be the Nairobi hotel transfer (id 1) because validation checks that the id exists, not that the route matches the destination.
15. **`tours.slug` is globally unique** while accommodation slugs are unique per company. Fine at three companies today; it will collide if another tenant wants the same slug.
16. **External image URLs** on tours 2 and 4 (`i.pinimg.com`) are not assets the repo controls.
17. **Room type 129** (`ewc`, property null, no base rate) is an orphan type relative to Enchoro’s property.

## Launch gate

Do not send the first indexed, priced AHA pages live until all of the following are true:

1. Tour and lodge APIs used by the website return a price only when that price is marked confirmed, **or** those templates say Request a quote and do not render `price` / `price_from` / `original_price`.
2. `review_count` is removed or replaced with real testimonials.
3. Duplicate Mara activities and the two Mara transfers are reduced to one confirmed row each.
4. Lake Nakuru fee id 4 and the seed file agree, with a source and a check date written somewhere the dashboard can see.
5. Enchoro’s public figure is either the agreed selling rate (occupancy, season, currency, child rule stated on the page) or the price is hidden.
6. The six destination pages have been read by AHA staff. Unpublished destinations stay unpublished.
7. Tours 4, 6, 16, 21, 22, and 23 are not in the public list and not in the sitemap.
8. Itineraries 1 and 4 are not linked from any public index. Token pages stay noindex.
9. No partner property is named on a page unless it has a card, a confirmed rate, and a destination id.

A descriptive launch of the six destination URLs, with no tariffs and no review counts, is the only slice that is close. Even that still wants a staff pass on the one-paragraph descriptions, because they were seeded from `itinerary-catalog-data.ts` and this audit did not verify them against AHA’s preferred wording.

## Access limits

The audit used the server Postgres connection configured for the app (`frontend/.env.local`, transaction pooler). That connection is the database owner and bypasses RLS, which is the same path the Next.js server uses (`frontend/src/lib/db.ts`). Row counts above are from that database, not from a local dump. Storage objects in Supabase Storage were not listed; image checks were against `frontend/public` and the URL strings stored in Postgres. No customer PII was copied into this file.
