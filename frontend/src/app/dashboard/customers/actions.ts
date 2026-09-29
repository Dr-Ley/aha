"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  createCustomerFromStaff,
  findOrCreateCustomerFromGuest,
  updateCustomerForCompany,
} from "@/lib/customers";
import { emailSchema } from "@/lib/schemas/public";
import { requireTenantContext } from "@/server/tenancy";
import { CUSTOMER_MODULES } from "./tenant";

const createSchema = z.object({
  companyId: z.string().min(1).max(32),
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().max(100).optional(),
  email: z.union([emailSchema, z.literal("")]).optional(),
  phone: z.string().max(50).optional(),
  nationality: z.string().max(100).optional(),
});

const notesSchema = z.object({
  companyId: z.string().min(1).max(32),
  id: z.coerce.number().int().positive(),
  notes: z.string().max(8000),
});

async function tenantForWrite(companyId: string) {
  return requireTenantContext(companyId, {
    module: CUSTOMER_MODULES,
    requireEdit: true,
  });
}

export async function createCustomerAction(formData: FormData) {
  const parsed = createSchema.safeParse({
    companyId: String(formData.get("companyId") ?? ""),
    firstName: String(formData.get("firstName") ?? ""),
    lastName: String(formData.get("lastName") ?? "") || undefined,
    email: String(formData.get("email") ?? "").trim(),
    phone: String(formData.get("phone") ?? "") || undefined,
    nationality: String(formData.get("nationality") ?? "") || undefined,
  });
  if (!parsed.success) {
    redirect("/dashboard/customers?error=Invalid+customer+details");
  }

  const tenant = await tenantForWrite(parsed.data.companyId);
  if (!tenant.ok) {
    redirect("/dashboard/customers?error=Forbidden");
  }

  const email = parsed.data.email || null;
  const id = email
    ? await findOrCreateCustomerFromGuest(tenant.ctx.companyId, {
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
        email,
        phone: parsed.data.phone,
        country: parsed.data.nationality,
      })
    : await createCustomerFromStaff(tenant.ctx.companyId, {
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
        email,
        phone: parsed.data.phone,
        country: parsed.data.nationality,
      });

  if (id == null) {
    redirect("/dashboard/customers?error=Name+is+required");
  }

  if (parsed.data.nationality) {
    await updateCustomerForCompany(tenant.ctx.companyId, id, {
      nationality: parsed.data.nationality,
    });
  }

  revalidatePath("/dashboard/customers");
  redirect(`/dashboard/customers/${id}`);
}

export async function updateCustomerNotesAction(formData: FormData) {
  const parsed = notesSchema.safeParse({
    companyId: String(formData.get("companyId") ?? ""),
    id: formData.get("id"),
    notes: String(formData.get("notes") ?? ""),
  });
  if (!parsed.success) {
    redirect("/dashboard/customers?error=Invalid+notes");
  }

  const tenant = await tenantForWrite(parsed.data.companyId);
  if (!tenant.ok) {
    redirect(`/dashboard/customers/${parsed.data.id}?error=Forbidden`);
  }

  const updated = await updateCustomerForCompany(tenant.ctx.companyId, parsed.data.id, {
    notes: parsed.data.notes,
  });
  if (!updated) {
    redirect(`/dashboard/customers/${parsed.data.id}?error=Not+found`);
  }

  revalidatePath("/dashboard/customers");
  revalidatePath(`/dashboard/customers/${parsed.data.id}`);
  redirect(`/dashboard/customers/${parsed.data.id}`);
}
