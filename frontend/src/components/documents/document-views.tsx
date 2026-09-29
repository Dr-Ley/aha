import type {
  BookingVoucherModel,
  HotelServiceVoucherModel,
  InvoiceDocumentModel,
  PaymentReceiptModel,
} from "@/lib/documents/models";
import type { CompanyLetterhead } from "@/lib/documents/letterhead";
import { VoucherToCompanyField } from "@/components/documents/voucher-to-company-field";

function LetterheadBlock({ letterhead }: { letterhead: CompanyLetterhead }) {
  return (
    <header className="border-b-2 border-neutral-800 pb-3 mb-4 flex items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-xl font-bold tracking-wide uppercase">{letterhead.legalName}</h1>
        {letterhead.tagline ? (
          <p className="text-sm font-medium text-neutral-700">{letterhead.tagline}</p>
        ) : null}
        <div className="mt-2 text-xs leading-relaxed text-neutral-700">
          {letterhead.lines.map((line) => (
            <div key={line}>{line}</div>
          ))}
          {letterhead.phones.map((p) => (
            <div key={p}>Tel: {p}</div>
          ))}
          <div>Email: {letterhead.email}</div>
          <div>Web: {letterhead.website}</div>
        </div>
      </div>
      {letterhead.logo ? (
        // eslint-disable-next-line @next/next/no-img-element -- print pages use arbitrary company URLs
        <img
          src={letterhead.logo}
          alt={letterhead.legalName}
          className="h-16 w-auto max-w-[180px] object-contain shrink-0"
        />
      ) : null}
    </header>
  );
}

function Check({ on, label }: { on: boolean; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 mr-3 text-xs">
      <span className="inline-block w-3.5 h-3.5 border border-neutral-800 text-center leading-3 text-[10px]">
        {on ? "✓" : ""}
      </span>
      {label}
    </span>
  );
}

export function BookingVoucherDocument({
  model,
  toCompanyEdit,
}: {
  model: BookingVoucherModel;
  toCompanyEdit?: { bookingId: number; companyId: string; canEdit: boolean };
}) {
  return (
    <article className="mx-auto max-w-[800px] bg-white text-neutral-900 p-6 print:p-0">
      <LetterheadBlock letterhead={model.letterhead} />
      <div className="flex items-start justify-between gap-4 mb-4">
        <h2 className="text-lg font-bold underline underline-offset-4">{model.documentTitle}</h2>
        <div className="text-sm border border-neutral-800 px-3 py-1">No. {model.documentNumber}</div>
      </div>
      <div className="space-y-3 text-sm">
        <div className="border-b border-neutral-400 pb-1">
          <span className="font-semibold">Name of Client: </span>
          {model.clientName}
          {model.partySizeLabel ? (
            <span className="ml-2 text-neutral-600">{model.partySizeLabel}</span>
          ) : null}
        </div>
        <div>
          <span className="font-semibold mr-2">Client:</span>
          <Check on={model.clientCategory === "resident"} label="RESIDENT" />
          <Check on={model.clientCategory === "non_resident"} label="NON-RESIDENT" />
        </div>
        {toCompanyEdit ? (
          <VoucherToCompanyField
            bookingId={toCompanyEdit.bookingId}
            companyId={toCompanyEdit.companyId}
            initial={model.toCompanyName}
            canEdit={toCompanyEdit.canEdit}
          />
        ) : (
          <div className="border-b border-neutral-400 pb-1">
            <span className="font-semibold">To (Company / Supplier): </span>
            {model.toCompanyName ?? "_______________________________"}
          </div>
        )}
        <div>
          <div className="font-semibold mb-1">Reserve:</div>
          <div className="flex flex-wrap gap-y-1">
            <Check on={model.reserveFlags.hotel} label="HOTEL" />
            <Check on={model.reserveFlags.lodge} label="LODGE" />
            <Check on={model.reserveFlags.camping} label="CAMPING" />
            <Check on={model.reserveFlags.lunch} label="LUNCH" />
            <Check on={model.reserveFlags.dinner} label="DINNER" />
            <Check on={model.reserveFlags.transport} label="TRANSPORT" />
          </div>
        </div>
        <div>
          <div className="font-semibold mb-1">Instructions / Special notes:</div>
          <div className="min-h-[4.5rem] border border-neutral-400 p-2 whitespace-pre-wrap">
            {model.instructions}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="border-b border-neutral-400 pb-1">
            <span className="font-semibold">Form of payment: </span>
            {model.formOfPayment ?? "_______________"}
          </div>
          <div className="border-b border-neutral-400 pb-1">
            <span className="font-semibold">Total enclosed: </span>
            {model.totalEnclosedLabel ?? "N/A"}
          </div>
        </div>
        <div className="border-b border-neutral-400 pb-1">
          <span className="font-semibold">Remark: </span>
          {model.remark ?? ""}
        </div>
        <div className="grid grid-cols-2 gap-4 pt-6">
          <div>
            <div className="border-b border-neutral-800 h-8" />
            <div className="text-xs mt-1">Sign / Official stamp</div>
          </div>
          <div>
            <div className="border-b border-neutral-800 pb-1 min-h-[2rem]">
              {model.preparedName ?? ""}
            </div>
            <div className="text-xs mt-1">Name — {model.letterhead.legalName}</div>
            <div className="text-xs text-neutral-600">Date: {model.createdOn}</div>
          </div>
        </div>
      </div>
    </article>
  );
}

export function HotelServiceVoucherDocument({ model }: { model: HotelServiceVoucherModel }) {
  return (
    <article className="mx-auto max-w-[900px] bg-white text-neutral-900 p-6 print:p-0">
      <LetterheadBlock letterhead={model.letterhead} />
      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div>
          <h2 className="text-lg font-bold">{model.documentTitle}</h2>
          <div>Reservation #: {model.reservationNumber}</div>
          <div>Prepared by: {model.preparedBy ?? "—"}</div>
          <div>Created on: {model.createdOn}</div>
        </div>
        <div className="text-right">
          <div className="font-semibold capitalize">Status: {model.status}</div>
          <div className="mt-2 font-medium">{model.totalAmountLabel}</div>
        </div>
      </div>
      <section className="border border-neutral-800 mb-4 text-sm">
        <div className="grid grid-cols-2 border-b border-neutral-400">
          <div className="p-2 border-r border-neutral-400">
            <span className="font-semibold">Guest name: </span>
            {model.guestName}
          </div>
          <div className="p-2">
            <span className="font-semibold">Agent: </span>
            {model.agentName ?? "—"}
          </div>
        </div>
        <div className="grid grid-cols-3">
          <div className="p-2 border-r border-neutral-400">
            Adults: <strong>{model.adults}</strong>
          </div>
          <div className="p-2 border-r border-neutral-400">
            Children: <strong>{model.children}</strong>
          </div>
          <div className="p-2">
            Total guests: <strong>{model.totalGuests}</strong>
          </div>
        </div>
        {model.specialRequests ? (
          <div className="p-2 border-t border-neutral-400">
            <span className="font-semibold">Notes: </span>
            {model.specialRequests}
          </div>
        ) : null}
      </section>
      <table className="w-full border-collapse text-sm mb-4">
        <thead>
          <tr className="bg-neutral-100">
            <th className="border border-neutral-800 p-2 text-left">Description</th>
            <th className="border border-neutral-800 p-2 text-left">Nights / Period</th>
            <th className="border border-neutral-800 p-2 text-right">Pax</th>
            <th className="border border-neutral-800 p-2 text-right">Units</th>
            <th className="border border-neutral-800 p-2 text-right">Pax/Unit</th>
          </tr>
        </thead>
        <tbody>
          {model.lines.map((line, i) => (
            <tr key={`${line.description}-${i}`}>
              <td className="border border-neutral-800 p-2">{line.description}</td>
              <td className="border border-neutral-800 p-2">{line.nightsPeriod}</td>
              <td className="border border-neutral-800 p-2 text-right">{line.pax ?? ""}</td>
              <td className="border border-neutral-800 p-2 text-right">{line.units ?? ""}</td>
              <td className="border border-neutral-800 p-2 text-right">{line.paxPerUnit ?? ""}</td>
            </tr>
          ))}
          {Array.from({ length: Math.max(0, 3 - model.lines.length) }).map((_, i) => (
            <tr key={`empty-${i}`}>
              <td className="border border-neutral-800 p-2 h-8" />
              <td className="border border-neutral-800 p-2" />
              <td className="border border-neutral-800 p-2" />
              <td className="border border-neutral-800 p-2" />
              <td className="border border-neutral-800 p-2" />
            </tr>
          ))}
        </tbody>
      </table>
      <section className="text-xs leading-relaxed text-neutral-700 space-y-2 border-t border-neutral-400 pt-3">
        <p>
          <strong>Check-in / Check-out:</strong> Check-in from 11:00 AM. Check-out by 10:00 AM.
          Stay nights: {model.nights} ({model.checkInDate} → {model.checkOutDate}).
        </p>
        <p>
          <strong>Reservation notes:</strong> A deposit may be required to confirm. Rooming lists
          for groups should be shared in advance. Room: {model.roomLabel}.
        </p>
        <p>
          Thank you for choosing {model.letterhead.legalName}
          {model.letterhead.whatsapp
            ? `! Questions? WhatsApp/Call ${model.letterhead.whatsapp}`
            : ""}
          {model.letterhead.reservationEmail
            ? ` | ${model.letterhead.reservationEmail}`
            : ""}
        </p>
      </section>
    </article>
  );
}

export function PaymentReceiptDocument({ model }: { model: PaymentReceiptModel }) {
  return (
    <article className="mx-auto max-w-[720px] bg-white text-neutral-900 p-6 print:p-0">
      <LetterheadBlock letterhead={model.letterhead} />
      <div className="flex items-start justify-between mb-4">
        <h2 className="text-lg font-bold tracking-wide">{model.documentTitle}</h2>
        <div className="text-sm">
          <div>
            No. <span className="font-semibold text-red-700">{model.receiptNumber}</span>
          </div>
          <div>Date {model.date}</div>
        </div>
      </div>
      <div className="space-y-3 text-sm">
        <div className="border-b border-neutral-400 pb-1">
          <span className="font-semibold">RECEIVED from: </span>
          {model.receivedFrom}
        </div>
        <div className="border-b border-neutral-400 pb-1">
          <span className="font-semibold">Sum of Kshs./USD: </span>
          {model.amountWords}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="border-b border-neutral-400 pb-1">
            Safari start date: {model.safariStartDate ?? "_______________"}
          </div>
          <div className="border-b border-neutral-400 pb-1">
            Safari end date: {model.safariEndDate ?? "_______________"}
          </div>
          <div className="border-b border-neutral-400 pb-1">
            Check in: {model.checkInDate ?? "_______________"}
          </div>
          <div className="border-b border-neutral-400 pb-1">
            Check out: {model.checkOutDate ?? "_______________"}
          </div>
        </div>
        <div>
          <div className="font-semibold mb-1">Being payment of:</div>
          <div className="flex flex-wrap gap-y-1">
            <Check on={model.beingPaymentOf.accommodation} label="Accommodation" />
            <Check on={model.beingPaymentOf.fullBoard} label="F/B" />
            <Check on={model.beingPaymentOf.halfBoard} label="H/B" />
            <Check on={model.beingPaymentOf.tours} label="Tours" />
            <Check on={model.beingPaymentOf.food} label="Food" />
            <Check on={model.beingPaymentOf.others} label="Others" />
          </div>
        </div>
        {model.method ? (
          <div>
            <span className="font-semibold">Method: </span>
            {model.method}
          </div>
        ) : null}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="border-b border-neutral-400 pb-1">
            <span className="font-semibold">Deposit paid: </span>
            {model.depositPaidLabel}
          </div>
          <div className="border-b border-neutral-400 pb-1">
            <span className="font-semibold">Balance: </span>
            {model.balanceLabel}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 pt-8">
          <div>
            <div className="border-b border-neutral-800 h-8" />
            <div className="text-xs mt-1">Signature of paying pax</div>
          </div>
          <div>
            <div className="border-b border-neutral-800 pb-1 min-h-[2rem]">
              {model.officialName ?? ""}
            </div>
            <div className="text-xs mt-1">{model.letterhead.legalName} Official</div>
          </div>
        </div>
        <div className="text-right text-sm font-semibold pt-2">Amount: {model.amountFigures}</div>
      </div>
    </article>
  );
}

export function InvoiceDocument({ model }: { model: InvoiceDocumentModel }) {
  return (
    <article className="mx-auto max-w-[800px] bg-white text-neutral-900 p-6 print:p-0">
      <LetterheadBlock letterhead={model.letterhead} />
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold tracking-wide">{model.documentTitle}</h2>
          <div className="text-sm capitalize">Status: {model.status}</div>
        </div>
        <div className="text-sm text-right">
          <div>
            No. <span className="font-semibold">{model.invoiceNumber}</span>
          </div>
          <div>Date {model.date}</div>
        </div>
      </div>
      <div className="border-b border-neutral-400 pb-2 mb-4 text-sm">
        <span className="font-semibold">Bill to: </span>
        {model.billTo}
      </div>
      <table className="w-full border-collapse text-sm mb-4">
        <thead>
          <tr className="bg-neutral-100">
            <th className="border border-neutral-800 p-2 text-left">Description</th>
            <th className="border border-neutral-800 p-2 text-right">Qty</th>
            <th className="border border-neutral-800 p-2 text-right">Unit</th>
            <th className="border border-neutral-800 p-2 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {model.lines.map((line, i) => (
            <tr key={`${line.description}-${i}`}>
              <td className="border border-neutral-800 p-2">{line.description}</td>
              <td className="border border-neutral-800 p-2 text-right">{line.quantity}</td>
              <td className="border border-neutral-800 p-2 text-right">{line.unitAmountLabel}</td>
              <td className="border border-neutral-800 p-2 text-right">{line.lineTotalLabel}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="ml-auto w-64 text-sm space-y-1">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{model.subtotalLabel}</span>
        </div>
        <div className="flex justify-between">
          <span>Amount paid</span>
          <span>{model.amountPaidLabel}</span>
        </div>
        <div className="flex justify-between font-semibold border-t border-neutral-800 pt-1">
          <span>Balance</span>
          <span>{model.balanceLabel}</span>
        </div>
      </div>
      {model.notes ? (
        <p className="mt-6 text-xs text-neutral-700 whitespace-pre-wrap">{model.notes}</p>
      ) : null}
    </article>
  );
}
