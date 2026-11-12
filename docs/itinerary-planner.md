# AHA deterministic itinerary planner

Design and first implementation. No production rows were inserted or updated, and no migration was applied.

## 1. Architecture

The existing generator stays the system of record for storage, access control, versions, and `quoteItineraryPlan`. A planner now runs first.

```text
requirements
  -> planItinerary (catalog IDs, route graph, hard constraints)
  -> optional LLM narrative on the locked skeleton
  -> validateItineraryPlan (existing)
  -> assessItineraryQuote (existing quote + confirmation status)
  -> itineraries / itinerary_components
```

Google OR-Tools is not justified. The search is a few destinations, a duration under 30 days, and one vehicle. Breadth-first hop search on an explicit edge list is enough and is testable. Revisit a solver only if the same request must assign a dated fleet, guides, and room inventory together.

Neo4j is not needed. The graph is a few dozen destination pairs.

The public page stays `/itineraries/[token]`. A `/itineraries/[slug]/[id]` route would publish guessable serial ids. The token page is already `noindex`. The new layout is the client view of that page.

## 2. Domain types and services

Existing types in `frontend/src/server/services/itinerary/types.ts` remain the skeleton: `ItineraryRequirements`, `ItineraryPlan`, `ItineraryDayPlan`, `TourismCatalog`.

Added:

| Module | Role |
|---|---|
| `planner/route-graph.ts` | `ROUTE_EDGES`, `shortestRoute` |
| `planner/plan.ts` | `planItinerary` |
| `planner/price-assessment.ts` | `assessItineraryQuote` |
| `planner/narrative.ts` | `applyNarrative` — copies title, summary, and day notes only |
| `features/tourism/accommodation-contracts.ts` | Supplier contracts from `accommodation_data.txt` |

`AccommodationContract.sellingConfirmed` is `false` on every seeded contract. `assessItineraryQuote` adds `pricingStatus: "quote_required" | "confirmed"` and `confirmationReasons` onto the existing quote snapshot.

## 3. Algorithm and constraints

1. Reject an empty destination list, an unknown destination id, a party of zero, or a duration outside 1–30.
2. Keep the requested destination order.
3. Connect consecutive parks with `shortestRoute`. Intermediate hubs (usually Nairobi) must already exist in `destinations`. If the path needs more days than requested, refuse and name the route.
4. Give every stop one day, then spare days to non-Nairobi stops.
5. Pick the smallest catalog `transport_options` row whose `capacity` fits adults + children. Infants do not take a seat, matching `validation.ts`. A preferred vehicle type wins only if it fits. No fitting vehicle is a hard failure.
6. Pick a catalog `accommodations` row whose `destination_id` matches the stop. A linked contract with `maxOccupancy` below the party is skipped. If every lodge fails occupancy, the night is left empty and the plan says so.
7. Attach a `transfer_options` row only when `from_label` / `to_label` match the places. A Nairobi hotel transfer is not attached to a park arrival.
8. Attach requested `activity_offerings` that belong to that destination. Otherwise one zero-price game drive if the catalog has one. Paid activities such as balloons are not added unless requested.
9. Supported but unpriced roads, missing lodges, and undated rates are warnings. The plan can still be saved as quote-required.

A fully priceable itinerary requires every used component to have a validity window covering the stay and `sellingConfirmed`. Nothing in the live catalog has those fields, so every assessed quote is `quote_required` even when Enzi can still compute a working number.

## 4. Pricing

`quoteItineraryPlan` is unchanged and still does not accept AI amounts. It prices:

- accommodation from `accommodations.price_from` per adult-night, child at 75% in code, last day excluded
- park fees from `park_fee_rates` per person per destination day, July–December vs January–June via `parkSeasonForDate`
- activities from `activity_offerings`
- transport from `transport_options.daily_rate_usd` times duration
- transfers as one flat `amount_usd`
- markup and rounding through `PricingService.quoteComponents`

`assessItineraryQuote` labels that result `quote_required` and lists why. The guest page shows “Request a quote” and the working figure as unconfirmed. Currency stays the itinerary currency, stored as whole units the way the existing engine already does.

## 5. Data requirements and blockers

Keep using:

- `destinations`, `attractions`
- `accommodations` for the public card and the current per-adult `price_from`
- `activity_offerings`, `park_fee_rates`, `transfer_options`, `transport_options`
- `itineraries.plan` and `itineraries.quote` JSON

`room_type_rates` stays the EWC occupancy card. It cannot store these contracts: the unique key is `(company_id, occupancy, season, guest_category, year)` and it has no property, no `valid_from` / `valid_to`, and no per-room versus per-person basis.

The attached contracts are seeded in `accommodation-contracts.ts`, not in Postgres. Writing `price_from` from them would publish unconfirmed selling prices. Samburu, Karatu, Nyeri, and Mombasa Beach have no matching `destinations.slug`, so those contracts cannot be selected. Several properties in the text (Heritage circuit discounts, Royal Mara, Baghayo, Outspan) have no complete numeric matrix in the file and were not invented.

Availability is not a column on partner properties. The planner never treats a room as held.

## 6. API changes

`POST` generate still uses `/api/itineraries/[id]/generate`. Behavior change: the planner builds the skeleton; the provider is asked only for narrative JSON. A provider failure keeps the planner text. A route failure returns 422 and does not call the model for a new skeleton.

`GET /api/itineraries/[token]` is unchanged. `quote.pricingStatus` and `quote.confirmationReasons` appear on newly generated quotes.

The public page renders `components/itinerary/document.tsx` (cover, brief, trip table, days, route list, costs, practical notes, print). There is no flight table, so the flights filter is an explicit empty state. There is no map library in the app, so the route is a numbered list. Edits stay on the same page and still go through `validateItineraryPlan`.

## 7. Migration

Not applied. When AHA is ready to confirm rates, add:

- `route_edges (from_destination_id, to_destination_id, mode, transfer_option_id, active)`
- `supplier_rate_periods (property_id, room_label, occupancy, meal_basis, guest_category, currency, amount, basis, valid_from, valid_to, confirmation_status, child_min_age, child_max_age, child_amount)`

Until those exist, the TypeScript edge list and contract file are the planning inputs. Do not overload `room_type_rates`.

## 8. Implementation phases

1. Done: planner, route graph, quote-required assessment, narrative lock, contract seed in the repo, guest layout.
2. Staff confirm which contract rows are selling rates and which destination slugs Samburu, Nyeri, and the coast should use.
3. Apply the two tables and link `properties` rows. Only then may `pricingStatus` become `confirmed`.
4. Replace `ROUTE_EDGES` with `route_edges`.
5. Optional: availability, if a real allotment source exists.

## 9. Tests

`frontend/src/server/services/itinerary/planner/planner.test.ts` covers the Nairobi connection, a refused unknown park, vehicle capacity, Mara skeleton ids, narrative that cannot change ids, quote-required status, and Sopa contract matching.

Existing `itinerary.test.ts` still covers validation, the old quote math, and the heuristic provider. The heuristic provider now returns an empty narrative when `mode` is `"narrative"` and otherwise keeps its previous catalog sequencer for those tests.
