"use server";
// actions/invoices.ts – Invoice management
import { revalidatePath } from "next/cache";
import connectDB from "@/lib/db";
import InvoiceModel from "@/models/Invoice";
import PatientModel from "@/models/Patient";
import { withAuth } from "@/lib/auth-guard";
import { createInvoiceSchema, markInvoicePaidSchema } from "@/lib/validations";
import { generateInvoiceId, nairaToKobo } from "@/lib/utils";
import { audit } from "@/lib/audit";
import type { ActionResult, IInvoice } from "@/types";

export async function getInvoices(status?: string, patientId?: string): Promise<ActionResult<IInvoice[]>> {
  return withAuth(["admin", "receptionist"], async () => {
    await connectDB();
    const filter: Record<string, unknown> = {};
    if (status && status !== "all") filter.status = status;
    if (patientId) {
      const patient = await PatientModel.findOne({ patientId: patientId.toUpperCase() });
      if (patient) filter.patient = patient._id;
    }
    const invoices = await InvoiceModel.find(filter)
      .populate("patient", "firstName lastName patientId phone")
      .populate("createdBy", "firstName lastName")
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();
    return { success: true, message: "Invoices fetched", data: invoices as unknown as IInvoice[] };
  });
}

export async function createInvoice(formData: FormData): Promise<ActionResult<IInvoice>> {
  return withAuth(["admin", "receptionist"], async (currentUser) => {
    // Parse items from JSON string in formData
    const itemsRaw = formData.get("items") as string;
    let parsedItems;
    try {
      parsedItems = JSON.parse(itemsRaw);
    } catch {
      return { success: false, message: "Invalid invoice items." };
    }

    const raw = {
      patientId: (formData.get("patientId") as string)?.trim().toUpperCase(),
      items: parsedItems,
      paymentType: formData.get("paymentType") as string,
      notes: (formData.get("notes") as string)?.trim() || undefined,
    };

    const result = createInvoiceSchema.safeParse(raw);
    if (!result.success) {
      return {
        success: false,
        message: "Validation failed",
        errors: result.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    await connectDB();

    const patient = await PatientModel.findOne({ patientId: result.data.patientId });
    if (!patient) return { success: false, message: "Patient not found." };

    const invoiceId = generateInvoiceId();

    // Convert Naira to Kobo for each item
    const items = result.data.items.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      unitPriceKobo: nairaToKobo(item.unitPriceNaira),
    }));

    const totalKobo = items.reduce(
      (sum, item) => sum + item.unitPriceKobo * item.quantity,
      0
    );

    const invoice = await InvoiceModel.create({
      invoiceId,
      patient: patient._id,
      createdBy: currentUser.id,
      items,
      totalKobo,
      amountPaidKobo: 0,
      paymentType: result.data.paymentType,
      notes: result.data.notes,
    });

    await audit({
      actor: currentUser,
      action: "CREATE_INVOICE",
      resource: "invoices",
      resourceId: invoice._id.toString(),
      details: { invoiceId, totalKobo, patientId: result.data.patientId },
    });

    revalidatePath("/receptionist/invoices");
    revalidatePath("/admin/reports");

    return {
      success: true,
      message: `Invoice ${invoiceId} created successfully.`,
      data: invoice as unknown as IInvoice,
    };
  });
}

export async function markInvoicePaid(formData: FormData): Promise<ActionResult<IInvoice>> {
  return withAuth(["admin", "receptionist"], async (currentUser) => {
    const raw = {
      invoiceId: formData.get("invoiceId") as string,
      amountPaidNaira: formData.get("amountPaidNaira"),
    };

    const result = markInvoicePaidSchema.safeParse(raw);
    if (!result.success) {
      return { success: false, message: "Invalid data." };
    }

    await connectDB();

    const invoice = await InvoiceModel.findOne({ invoiceId: result.data.invoiceId });
    if (!invoice) return { success: false, message: "Invoice not found." };

    const amountPaidKobo = nairaToKobo(result.data.amountPaidNaira);
    const newTotalPaid = invoice.amountPaidKobo + amountPaidKobo;
    const isPaid = newTotalPaid >= invoice.totalKobo;

    await InvoiceModel.findByIdAndUpdate(invoice._id, {
      amountPaidKobo: newTotalPaid,
      status: isPaid ? "paid" : "partial",
      paidAt: isPaid ? new Date() : undefined,
    });

    await audit({
      actor: currentUser,
      action: "MARK_INVOICE_PAID",
      resource: "invoices",
      resourceId: invoice._id.toString(),
      details: { invoiceId: result.data.invoiceId, amountPaidKobo, isPaid },
    });

    revalidatePath("/receptionist/invoices");
    revalidatePath("/admin/reports");

    return {
      success: true,
      message: isPaid ? "Invoice fully paid." : `Partial payment recorded. Balance remaining.`,
      data: invoice as unknown as IInvoice,
    };
  });
}
