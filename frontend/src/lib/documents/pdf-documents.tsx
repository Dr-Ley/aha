import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { DocumentModel } from "@/lib/documents/models";
import type { CompanyLetterhead } from "@/lib/documents/letterhead";

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 10, fontFamily: "Helvetica", color: "#171717" },
  header: { borderBottomWidth: 2, borderBottomColor: "#171717", paddingBottom: 8, marginBottom: 12 },
  title: { fontSize: 16, fontFamily: "Helvetica-Bold", textTransform: "uppercase" },
  tagline: { fontSize: 10, marginTop: 2 },
  muted: { color: "#404040", marginTop: 2 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  line: { borderBottomWidth: 1, borderBottomColor: "#a3a3a3", paddingBottom: 4, marginBottom: 8 },
  heading: { fontSize: 13, fontFamily: "Helvetica-Bold", marginBottom: 6 },
  tableHeader: { flexDirection: "row", backgroundColor: "#f5f5f5", borderWidth: 1, borderColor: "#171717" },
  tableRow: { flexDirection: "row", borderLeftWidth: 1, borderRightWidth: 1, borderBottomWidth: 1, borderColor: "#171717" },
  cell: { padding: 4 },
  totals: { marginLeft: "auto", width: 200, marginTop: 8 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 3 },
  bold: { fontFamily: "Helvetica-Bold" },
});

function Letterhead({ letterhead }: { letterhead: CompanyLetterhead }) {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>{letterhead.legalName}</Text>
      {letterhead.tagline ? <Text style={styles.tagline}>{letterhead.tagline}</Text> : null}
      {letterhead.lines.map((line) => (
        <Text key={line} style={styles.muted}>
          {line}
        </Text>
      ))}
      {letterhead.phones.map((p) => (
        <Text key={p} style={styles.muted}>
          Tel: {p}
        </Text>
      ))}
      <Text style={styles.muted}>Email: {letterhead.email}</Text>
      <Text style={styles.muted}>Web: {letterhead.website}</Text>
    </View>
  );
}

function check(on: boolean, label: string): string {
  return `${on ? "[x]" : "[ ]"} ${label}`;
}

export function DocumentPdf({ model }: { model: DocumentModel }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Letterhead letterhead={model.letterhead} />
        {model.kind === "booking-voucher" ? (
          <View>
            <View style={styles.row}>
              <Text style={styles.heading}>{model.documentTitle}</Text>
              <Text>No. {model.documentNumber}</Text>
            </View>
            <Text style={styles.line}>Name of Client: {model.clientName} {model.partySizeLabel ?? ""}</Text>
            <Text style={styles.line}>
              Client: {check(model.clientCategory === "resident", "RESIDENT")}{" "}
              {check(model.clientCategory === "non_resident", "NON-RESIDENT")}
            </Text>
            <Text style={styles.line}>To (Company / Supplier): {model.toCompanyName ?? "_______________"}</Text>
            <Text style={styles.line}>
              Reserve: {check(model.reserveFlags.hotel, "HOTEL")} {check(model.reserveFlags.lodge, "LODGE")}{" "}
              {check(model.reserveFlags.camping, "CAMPING")} {check(model.reserveFlags.lunch, "LUNCH")}{" "}
              {check(model.reserveFlags.dinner, "DINNER")} {check(model.reserveFlags.transport, "TRANSPORT")}
            </Text>
            <Text style={styles.line}>Instructions: {model.instructions}</Text>
            <Text style={styles.line}>Form of payment: {model.formOfPayment ?? "_______________"}</Text>
            <Text style={styles.line}>Total enclosed: {model.totalEnclosedLabel ?? "N/A"}</Text>
            <Text style={styles.line}>Remark: {model.remark ?? ""}</Text>
            <Text style={styles.muted}>Prepared: {model.preparedName ?? ""} · {model.createdOn}</Text>
          </View>
        ) : null}
        {model.kind === "hotel-service-voucher" ? (
          <View>
            <View style={styles.row}>
              <View>
                <Text style={styles.heading}>{model.documentTitle}</Text>
                <Text>Reservation #: {model.reservationNumber}</Text>
                <Text>Prepared by: {model.preparedBy ?? "—"}</Text>
                <Text>Created on: {model.createdOn}</Text>
              </View>
              <View>
                <Text>Status: {model.status}</Text>
                <Text>{model.totalAmountLabel}</Text>
              </View>
            </View>
            <Text style={styles.line}>Guest name: {model.guestName}</Text>
            <Text style={styles.line}>Agent: {model.agentName ?? "—"}</Text>
            <Text style={styles.line}>
              Adults {model.adults} · Children {model.children} · Total {model.totalGuests}
            </Text>
            {model.lines.map((line, i) => (
              <Text key={`${line.description}-${i}`} style={styles.line}>
                {line.description} {line.nightsPeriod ? `· ${line.nightsPeriod}` : ""}
              </Text>
            ))}
          </View>
        ) : null}
        {model.kind === "payment-receipt" ? (
          <View>
            <View style={styles.row}>
              <Text style={styles.heading}>{model.documentTitle}</Text>
              <View>
                <Text>No. {model.receiptNumber}</Text>
                <Text>Date {model.date}</Text>
              </View>
            </View>
            <Text style={styles.line}>RECEIVED from: {model.receivedFrom}</Text>
            <Text style={styles.line}>Sum of Kshs./USD: {model.amountWords}</Text>
            <Text style={styles.line}>Safari: {model.safariStartDate ?? "—"} → {model.safariEndDate ?? "—"}</Text>
            <Text style={styles.line}>Stay: {model.checkInDate ?? "—"} → {model.checkOutDate ?? "—"}</Text>
            <Text style={styles.line}>Deposit paid: {model.depositPaidLabel}</Text>
            <Text style={styles.line}>Balance: {model.balanceLabel}</Text>
            <Text style={styles.muted}>Amount: {model.amountFigures}</Text>
          </View>
        ) : null}
        {model.kind === "invoice" ? (
          <View>
            <View style={styles.row}>
              <View>
                <Text style={styles.heading}>{model.documentTitle}</Text>
                <Text>Status: {model.status}</Text>
              </View>
              <View>
                <Text>No. {model.invoiceNumber}</Text>
                <Text>Date {model.date}</Text>
              </View>
            </View>
            <Text style={styles.line}>Bill to: {model.billTo}</Text>
            <View style={styles.tableHeader}>
              <Text style={[styles.cell, { width: "46%" }]}>Description</Text>
              <Text style={[styles.cell, { width: "12%" }]}>Qty</Text>
              <Text style={[styles.cell, { width: "21%" }]}>Unit</Text>
              <Text style={[styles.cell, { width: "21%" }]}>Amount</Text>
            </View>
            {model.lines.map((line, i) => (
              <View key={`${line.description}-${i}`} style={styles.tableRow}>
                <Text style={[styles.cell, { width: "46%" }]}>{line.description}</Text>
                <Text style={[styles.cell, { width: "12%" }]}>{line.quantity}</Text>
                <Text style={[styles.cell, { width: "21%" }]}>{line.unitAmountLabel}</Text>
                <Text style={[styles.cell, { width: "21%" }]}>{line.lineTotalLabel}</Text>
              </View>
            ))}
            <View style={styles.totals}>
              <View style={styles.totalRow}>
                <Text>Subtotal</Text>
                <Text>{model.subtotalLabel}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text>Amount paid</Text>
                <Text>{model.amountPaidLabel}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.bold}>Balance</Text>
                <Text style={styles.bold}>{model.balanceLabel}</Text>
              </View>
            </View>
            {model.notes ? <Text style={styles.muted}>{model.notes}</Text> : null}
          </View>
        ) : null}
      </Page>
    </Document>
  );
}
