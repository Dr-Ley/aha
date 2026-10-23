# Local MongoDB development

Local development uses MongoDB Community Server on this machine. `next dev` rejects any host other than `127.0.0.1`, `localhost`, or `::1` unless `MONGODB_ALLOW_REMOTE=true`. Leave that flag unset.

The import script does not read `MONGODB_URI` or `MONGODB_DB`. It connects only to `mongodb://127.0.0.1:27017/aha_dev`.

## Export format

`migrat/aha-neon-db-mongodb` has one file per collection. The file name, without `.json`, is the collection name (`bookings.json` is the `bookings` collection). There are 50 files and 17,986 documents.

Each file is a JSON array of documents, not newline-delimited JSON and not raw BSON. Dates are relaxed Extended JSON:

```json
{ "$date": "2026-06-05T10:50:46.274Z" }
```

`$date` is the only Extended JSON type in the export. Integer fields, including `_id` and money, are ordinary JSON integers. Three fields contain fractional JSON numbers: `tours.rating`, `bookings.exchange_rate_to_kes` (the value 129.5; other rows are whole numbers), and `itinerary_generation_logs.estimated_cost_usd`.

`_id` is the primary key. It is an integer in every collection except `companies`, whose `_id` values are the strings `aha`, `ewc`, and `bth`. Top-level field names are snake_case (`company_id`, `total_price`). CamelCase keys exist only inside nested snapshots and payloads such as `cost_stack`, booking versions, email bodies, and itinerary input. The importer keeps those names as they are.

Do not edit the files in `migrat/aha-neon-db-mongodb`.

## 1. Install Community Server and Compass

On a new Windows machine, in PowerShell:

```powershell
winget install MongoDB.Server
winget install MongoDB.Compass.Full
```

This workstation already has:

- Community Server 9.0 at `C:\Program Files\MongoDB\Server\9.0`
- Compass at `C:\Users\Hp\AppData\Local\MongoDBCompass\MongoDBCompass.exe`
- Database Tools `mongoimport` at `C:\Users\Hp\mongodbtools\bin\mongoimport.exe`

The import uses the Node.js driver and `EJSON` already installed in `frontend`. `mongoimport` is not the importer. Its default mode continues after a document error, and it does not enforce the local `aha_dev` lock on its own.

The server config binds to loopback only:

```yaml
net:
  port: 27017
  bindIp: 127.0.0.1
```

File: `C:\Program Files\MongoDB\Server\9.0\bin\mongod.cfg`.

## 2. Start the MongoDB service

The Windows service name is `MongoDB`. Its start mode is Automatic.

```powershell
Get-Service MongoDB
Start-Service MongoDB
```

Compass connects to `mongodb://127.0.0.1:27017`.

## 3. Configure `frontend/.env.local`

Next.js keeps the first value when a variable is assigned more than once. Keep a single active pair, and keep any Atlas URI commented out:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/aha_dev
MONGODB_DB=aha_dev
```

`MONGODB_DB` overrides the database name in the URI for the app. Both name `aha_dev`. Do not set `MONGODB_ALLOW_REMOTE`.

`AUTH_SECRET` must be at least 16 characters or the app refuses to start. Other keys (Resend, Gemini, OpenAI) are optional for this import.

## 4. Import into `aha_dev`

From `frontend`:

```powershell
npm run import:local
```

That runs `tsx scripts/import-local-mongo.ts`.

The script:

- Refuses `mongodb+srv`, Atlas, and any database other than `aha_dev`.
- Parses each array with `EJSON.parse` in relaxed mode.
- Stores JSON integers as BSON int32 (int64 only if a value falls outside int32). It does not mint new `_id` values.
- Stores fractional JSON numbers as BSON double.
- Stores `$date` as a BSON Date. Date-only strings such as `travel_date` stay strings.
- Keeps field names, nested objects, and references (`company_id`, `booking_id`, `room_id`, and the rest).
- Inserts with ordered batches. If a document fails, the run stops and reports the collection, how many scratch documents were written, and the error. It does not continue past that document.
- Writes each collection to `_import_tmp_<name>` and renames it onto the real name only after the scratch count matches the file.
- Does not drop a non-empty collection unless you pass `--confirm-overwrite`.
- Replaces an empty collection of the same name, because it contains no documents.
- Does not create indexes. MongoDB still creates the mandatory `_id` index on each new collection.
- Does not run `npm run seed` or any backfill.

A non-empty target aborts before any collection is replaced. The error lists the collection names and counts.

## 5. Verify

```powershell
npm run import:local -- --check
```

`--check` only reads `aha_dev` and compares it with the export. It does not insert, drop, or rename.

In Compass, open database `aha_dev`. The collection list should be 50 names and these document counts:

| Collection | Documents |
| --- | ---: |
| accommodation_providers | 14 |
| accommodations | 2 |
| activity_offerings | 16 |
| attractions | 23 |
| bar_categories | 4 |
| bar_items | 10 |
| bar_order_items | 245 |
| bar_orders | 184 |
| booking_components | 26 |
| booking_versions | 33 |
| bookings | 23 |
| companies | 3 |
| company_memberships | 9 |
| contact_submissions | 1 |
| customers | 27 |
| destinations | 13 |
| email_deliveries | 30 |
| expenses | 319 |
| guides | 1 |
| hotel_booking_guests | 306 |
| hotel_booking_payments | 2974 |
| hotel_booking_rooms | 3328 |
| hotel_bookings | 3328 |
| invoice_items | 15 |
| invoices | 15 |
| itineraries | 16 |
| itinerary_components | 12 |
| itinerary_generation_logs | 29 |
| itinerary_versions | 28 |
| likes | 18 |
| notifications | 956 |
| park_fee_rates | 8 |
| payments | 1214 |
| properties | 16 |
| restaurant_categories | 2 |
| restaurant_items | 3 |
| restaurant_order_items | 282 |
| restaurant_orders | 281 |
| revenue_entries | 3994 |
| room_type_rates | 16 |
| room_types | 17 |
| rooms | 74 |
| testimonials | 3 |
| tours | 19 |
| transfer_options | 3 |
| transport_options | 4 |
| user_permissions | 31 |
| users | 7 |
| vehicle_providers | 1 |
| vehicles | 3 |

Total: 17,986 documents. The database name is `aha_dev`.

The checker also compares every stored document with the export, including integer `_id` BSON types, dates, money, and references. Representative rows include booking `_id` 7, the booking whose exchange rate is 129.5, tour `_id` 4, payment `_id` 16, hotel stay `_id` 192, expense `_id` 2, company string ids, and owner memberships.

## 6. Start Next.js after the import

Start the app only after `npm run import:local` has printed `import passed`, or after `--check` has printed `check passed`.

```powershell
cd frontend
npm run dev
```

Open `http://localhost:3000`.

Do not run `npm run seed` as a substitute for this import. Seed is a separate script and was not part of loading the export.

## Running the import again

Without a flag, a second run is safe only in the sense that it refuses to write. If any export collection in `aha_dev` already has documents, the script exits with an error and leaves those collections unchanged. It does not upsert, skip duplicates, or generate replacement ids.

To drop and load the export again:

```powershell
npm run import:local -- --confirm-overwrite
```

`--confirm-overwrite` replaces only the 50 collections named in the export, and only inside `aha_dev`. Collections that are not in the export are left in place. The database itself is not dropped. A crashed run may leave `_import_tmp_*` collections; the next import deletes those scratch collections before it writes.

An optional `--uri` is still rejected unless it is a single loopback host and the database path is `aha_dev`.
