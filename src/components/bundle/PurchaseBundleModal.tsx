import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Wallet as WalletIcon,
  Loader2,
  AlertCircle,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatPiastres } from "@/lib/money";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  bundleId: string;
  bundleTitle: string;
  amountPiastres: number;
  originalPiastres: number | null;
  coursesCount: number;
  onPurchased?: (info: { newBalance: number; reference: string; coursesIncluded: number }) => void;
}

export default function PurchaseBundleModal({
  open,
  onOpenChange,
  bundleId,
  bundleTitle,
  amountPiastres,
  originalPiastres,
  coursesCount,
  onPurchased,
}: Props) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<
    | { type: "success"; newBalance: number; reference: string; coursesIncluded: number }
    | { type: "error"; message: string; insufficient?: boolean }
    | null
  >(null);

  useEffect(() => {
    if (!open) return;
    setResult(null);
    setLoading(true);
    (async () => {
      if (!user) {
        setWalletBalance(null);
        setLoading(false);
        return;
      }
      const { data: wal } = await (supabase as any)
        .from("wallets")
        .select("balance_piastres")
        .eq("user_id", user.id)
        .maybeSingle();
      setWalletBalance(wal?.balance_piastres ?? 0);
      setLoading(false);
    })();
  }, [open, user]);

  const insufficient = walletBalance !== null && walletBalance < amountPiastres;
  const balanceAfter = walletBalance !== null ? walletBalance - amountPiastres : null;

  const handleConfirm = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const { data, error } = await (supabase as any).rpc("purchase_bundle", {
        p_bundle_id: bundleId,
      });
      if (error) throw error;
      if (data?.success) {
        setResult({
          type: "success",
          newBalance: data.new_balance_piastres ?? 0,
          reference: data.reference_number ?? "",
          coursesIncluded: data.courses_included ?? coursesCount,
        });
        onPurchased?.({
          newBalance: data.new_balance_piastres ?? 0,
          reference: data.reference_number ?? "",
          coursesIncluded: data.courses_included ?? coursesCount,
        });
      } else {
        setResult({
          type: "error",
          message: data?.failure_reason ?? "تعذّر إتمام عملية الشراء",
          insufficient: data?.failure_reason === "رصيد غير كافٍ",
        });
      }
    } catch (e: any) {
      setResult({ type: "error", message: e?.message ?? "حدث خطأ غير متوقع" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !submitting && onOpenChange(o)}>
      <DialogContent className="max-w-lg overflow-hidden p-0">
        <div className="p-6 pb-4 border-b border-border">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {result?.type === "success" ? "تم الشراء بنجاح" : "شراء الحزمة عبر المحفظة"}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mt-1 truncate">{bundleTitle}</p>
        </div>

        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {result?.type === "success" ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-4 py-4"
            >
              <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/10 flex items-center justify-center">
                <Sparkles className="w-10 h-10 text-emerald-500" />
              </div>
              <div>
                <div className="text-lg font-bold">
                  تم تسجيلك في {result.coursesIncluded} دورة
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  يمكنك الوصول إليها من «دوراتي» في لوحة التحكم.
                </div>
                {result.reference && (
                  <div className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-mono px-2 py-1 rounded bg-accent">
                    {result.reference}
                  </div>
                )}
              </div>
              <Button
                size="lg"
                className="w-full"
                onClick={() => {
                  onOpenChange(false);
                  setTimeout(() => navigate("/dashboard"), 50);
                }}
              >
                الذهاب إلى دوراتي
              </Button>
            </motion.div>
          ) : loading ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              <Skeleton className="h-20 w-full rounded-xl" />
              <Skeleton className="h-24 w-full rounded-xl" />
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="p-4 space-y-2 text-sm">
                  {originalPiastres !== null && originalPiastres > amountPiastres && (
                    <>
                      <Row label="السعر قبل الخصم" value={formatPiastres(originalPiastres)} muted />
                      <Row
                        label="السعر بعد الخصم"
                        value={formatPiastres(amountPiastres)}
                        strong
                      />
                    </>
                  )}
                  {!(originalPiastres !== null && originalPiastres > amountPiastres) && (
                    <Row label="سعر الحزمة" value={formatPiastres(amountPiastres)} strong />
                  )}
                  <Row label="عدد الدورات" value={`${coursesCount} دورة`} />
                  <div className="border-t border-border" />
                  <Row label="رصيد المحفظة الحالي" value={formatPiastres(walletBalance ?? 0)} />
                  <Row
                    label="الرصيد بعد الشراء"
                    value={formatPiastres(balanceAfter ?? 0)}
                    highlight={insufficient ? "danger" : "ok"}
                  />
                </div>
                {insufficient && (
                  <div className="px-4 py-3 bg-rose-500/10 border-t border-rose-500/20 text-sm">
                    <div className="font-semibold text-rose-700 dark:text-rose-300">رصيد غير كافٍ</div>
                    <button
                      onClick={() => {
                        onOpenChange(false);
                        setTimeout(() => navigate("/dashboard/wallet"), 50);
                      }}
                      className="text-xs underline text-rose-700 dark:text-rose-300 mt-0.5"
                    >
                      اذهب إلى المحفظة لشحن الرصيد
                    </button>
                  </div>
                )}
              </div>

              {result?.type === "error" && (
                <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-3 text-sm flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                  <div className="flex-1 font-semibold text-rose-700 dark:text-rose-300">
                    {result.message}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                عملية آمنة — يتم الخصم لمرة واحدة وتفعيل جميع دورات الحزمة فورًا.
              </div>

              <Button
                size="lg"
                className="w-full font-bold shadow-lg shadow-primary/20"
                disabled={submitting || insufficient}
                onClick={handleConfirm}
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                ) : (
                  <WalletIcon className="w-4 h-4 ml-2" />
                )}
                تأكيد الشراء بالمحفظة
              </Button>
            </motion.div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Row({
  label,
  value,
  strong,
  muted,
  highlight,
}: {
  label: string;
  value: string;
  strong?: boolean;
  muted?: boolean;
  highlight?: "ok" | "danger";
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={cn(
          strong && "font-bold text-base",
          muted && "line-through text-muted-foreground",
          highlight === "danger" && "text-rose-600 dark:text-rose-400 font-bold",
          highlight === "ok" && "text-emerald-600 dark:text-emerald-400 font-bold",
        )}
      >
        {value}
      </span>
    </div>
  );
}
