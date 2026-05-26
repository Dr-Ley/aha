import { z } from "zod";
import { COMPANY_IDS } from "@/types/company";

export const companyIdZod = z.enum(COMPANY_IDS);

/** Matches `financial_reference_type` in DB (polymorphic `reference_id`). */
export const financialReferenceTypeZod = z.enum(["tour", "hotel", "restaurant", "bar", "payment"]);
