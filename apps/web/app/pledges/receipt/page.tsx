import { Suspense } from "react";
import { ReceiptView } from "@/modules/funding/receipt-view";

export default function ReceiptPage() {
  return (
    <Suspense
      fallback={
        <div className="px-5 pt-16">
          <p className="voice text-[12px] text-muted">Loading…</p>
        </div>
      }
    >
      <ReceiptView />
    </Suspense>
  );
}
