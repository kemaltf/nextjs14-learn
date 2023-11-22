// all function that exported is server function
"use server";

import { z } from "zod";
import { sql } from "@vercel/postgres";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  amount: z.coerce.number(),
  status: z.enum(["pending", "paid"]),
  date: z.string(),
});

// creating new schema but ignoring specific property (if true it means ignored)
// using omit we can create new schema without write again the schema
const CreateInvoice = FormSchema.omit({ id: true, date: true });

export async function createInvoice(formData: FormData) {
  // there are several way to validate
  // if we use validate we validate and keep the schema type
  // if we use parse we convert the data type into schema form and validate
  const { customerId, amount, status } = CreateInvoice.parse({
    customerId: formData.get("customerId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  });

  const amountInCents = amount * 100;
  const date = new Date().toISOString().split("T")[0];

  await sql`
    INSERT INTO invoices (customer_id, amount, status, date)
    VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
  `;
  //Since you're updating the data displayed in the invoices route, you want to clear this cache and trigger a new request to the server.
  revalidatePath("/dashboard/invoices");
  // At this point, you also want to redirect the user back to the /dashboard/invoices page.
  redirect("/dashboard/invoices");
}
