import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BookOpen,
  ArrowRight,
  Package,
  Star,
  Tag,
  Loader2,
  Sparkles,
  CheckCircle2,
  GraduationCap,
  Wallet as WalletIcon,
} from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSignedThumbnail } from "@/hooks/use-signed-thumbnail";
import { EightPointStar } from "@/components/IslamicPatterns";
import { formatPiastres, getEffectivePrice } from "@/lib/money";
import PurchaseBundleModal from "@/components/bundle/PurchaseBundleModal";

interface BundleRow {
  id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  status: "draft" | "published";
  is_paid: boolean;
  price_piastres: number | null;
  discount_price_piastres: number | null;
  discount_expires_at: string | null;
  is_featured: boolean;
}

interface BundleCourse {
  course_id: string;
  position: number;
  courses: {
    id: string;
    title: string;
    description: string | null;
    thumbnail_url: string | null;
    status: "draft" | "coming_soon" | "published";
    is_paid: boolean | null;
  } | null;
}

const BundleDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile, loading: authLoading } = useAuth();
  const isAdmin = profile?.role === "admin";

  const [bundle, setBundle] = useState<BundleRow | null>(null);
  const [courses, setCourses] = useState<BundleCourse[]>([]);
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [enrollFree, setEnrollFree] = useState(false);
  const [purchaseOpen, setPurchaseOpen] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const { data: b, error: bErr } = await (supabase as any)
      .from("bundles")
      .select(
        "id, title, description, cover_image_url, status, is_paid, price_piastres, discount_price_piastres, discount_expires_at, is_featured",
      )
      .eq("id", id)
      .maybeSingle();

    if (bErr || !b) {
      setBundle(null);
      setCourses([]);
      setLoading(false);
      return;
    }
    setBundle(b as BundleRow);

    const { data: bc } = await (supabase as any)
      .from("bundle_courses")
      .select(
        "course_id, position, courses(id, title, description, thumbnail_url, status, is_paid)",
      )
      .eq("bundle_id", id)
      .order("position", { ascending: true });

    const list = (bc ?? []) as BundleCourse[];
    setCourses(list);

    if (user && list.length > 0) {
      const ids = list.map((c) => c.course_id);
      const { data: ens } = await (supabase as any)
        .from("enrollments")
        .select("course_id")
        .eq("user_id", user.id)
        .in("course_id", ids);
      setEnrolledIds(new Set((ens ?? []).map((e: any) => e.course_id)));
    } else {
      setEnrolledIds(new Set());
    }
    setLoading(false);
  }, [id, user]);

  useEffect(() => {
    load();
  }, [load]);

  const price = getEffectivePrice(
    bundle?.is_paid ? bundle.price_piastres : null,
    bundle?.discount_price_piastres,
    bundle?.discount_expires_at,
  );

  const visibleCourses = courses.filter((c) => {
    if (!c.courses) return false;
    if (isAdmin) return true;
    return c.courses.status === "published";
  });
  const enrolledCount = visibleCourses.filter((c) => enrolledIds.has(c.course_id)).length;
  const fullyEnrolled = visibleCourses.length > 0 && enrolledCount === visibleCourses.length;

  const handleFreeEnroll = async () => {
    if (!id || enrollFree) return;
    if (!user) {
      navigate("/login", { state: { from: location.pathname } });
      return;
    }
    setEnrollFree(true);
    try {
      const { data, error } = await (supabase as any).rpc("purchase_bundle", {
        p_bundle_id: id,
      });
      if (error) throw error;
      if (data?.success) {
        toast.success(`تم تسجيلك في ${data.courses_included ?? visibleCourses.length} دورة مجانًا`);
        await load();
      } else {
        toast.error(data?.failure_reason ?? "تعذّر إتمام التسجيل");
      }
    } catch (e: any) {
      toast.error(e?.message ?? "حدث خطأ غير متوقع");
    } finally {
      setEnrollFree(false);
    }
  };

  const cover = useSignedThumbnail(bundle?.cover_image_url);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-28 pb-16">
          <div className="container mx-auto px-4 max-w-5xl space-y-6">
            <Skeleton className="h-64 w-full rounded-3xl" />
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-24 w-full" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!bundle || (bundle.status !== "published" && !isAdmin)) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-40 pb-24">
          <div className="container mx-auto px-4 text-center max-w-md">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
              <Package className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold mb-2">الحزمة غير متاحة</h1>
            <p className="text-muted-foreground mb-6">
              قد تكون هذه الحزمة غير منشورة أو تم حذفها.
            </p>
            <Button asChild>
              <Link to="/bundles">
                <ArrowRight className="w-4 h-4 ml-2" />
                العودة إلى الحزم
              </Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const showDiscount = price.discountActive && price.originalAmount !== null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-28 pb-16 relative overflow-hidden">
        <EightPointStar
          size={80}
          className="absolute top-24 left-8 text-primary/5 animate-spin-slow pointer-events-none"
        />
        <div className="container mx-auto px-4 max-w-5xl">
          <Link
            to="/bundles"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowRight className="w-4 h-4" />
            كل الحزم
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border border-border bg-card overflow-hidden shadow-lg"
          >
            <div className="grid md:grid-cols-2">
              <div className="relative h-64 md:h-auto min-h-[16rem] overflow-hidden bg-accent">
                {cover ? (
                  <img
                    src={cover}
                    alt={bundle.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <Package className="w-14 h-14 opacity-30" />
                  </div>
                )}
                <div className="absolute top-4 right-4 flex flex-col items-end gap-2">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-full bg-primary/95 backdrop-blur text-primary-foreground shadow">
                    <Package className="w-3 h-3" /> حزمة
                  </span>
                  {bundle.is_featured && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-full bg-amber-500/95 text-white shadow">
                      <Star className="w-3 h-3 fill-current" /> مميزة
                    </span>
                  )}
                  {bundle.status !== "published" && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-3 py-1 rounded-full bg-amber-500/95 text-white shadow">
                      مسودة — إدارة فقط
                    </span>
                  )}
                </div>
              </div>

              <div className="p-6 md:p-8 flex flex-col">
                <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                  {bundle.title}
                </h1>
                <p className="text-muted-foreground leading-relaxed mb-6 flex-1">
                  {bundle.description || "حزمة دورات بسعر مخفّض"}
                </p>

                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                  <BookOpen className="w-4 h-4" />
                  تشمل {visibleCourses.length} دورة
                </div>

                <div className="rounded-2xl border border-border bg-background/60 p-4 mb-6">
                  <div className="flex items-end justify-between gap-3 flex-wrap">
                    <div className="flex flex-col">
                      {price.isFree ? (
                        <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                          مجانًا
                        </span>
                      ) : showDiscount ? (
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <span className="text-2xl font-extrabold text-primary">
                            {formatPiastres(price.amount)}
                          </span>
                          <span className="text-sm text-muted-foreground line-through">
                            {formatPiastres(price.originalAmount!)}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                            <Tag className="w-3 h-3" /> خصم
                          </span>
                        </div>
                      ) : (
                        <span className="text-2xl font-extrabold text-foreground">
                          {formatPiastres(price.amount)}
                        </span>
                      )}
                    </div>
                    {enrolledCount > 0 && !fullyEnrolled && (
                      <span className="text-xs text-muted-foreground">
                        مُسجَّل في {enrolledCount} من {visibleCourses.length}
                      </span>
                    )}
                  </div>

                  {fullyEnrolled ? (
                    <Button size="lg" className="w-full mt-4 font-bold" asChild>
                      <Link to="/dashboard">
                        <GraduationCap className="w-4 h-4 ml-2" />
                        ابدأ التعلم — دوراتي
                      </Link>
                    </Button>
                  ) : price.isFree ? (
                    <Button
                      size="lg"
                      className="w-full mt-4 font-bold"
                      disabled={enrollFree || authLoading}
                      onClick={handleFreeEnroll}
                    >
                      {enrollFree ? (
                        <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4 ml-2" />
                      )}
                      {user ? "التسجيل في الحزمة مجانًا" : "سجّل الدخول للتسجيل"}
                    </Button>
                  ) : (
                    <Button
                      size="lg"
                      className="w-full mt-4 font-bold shadow-lg shadow-primary/20"
                      disabled={authLoading}
                      onClick={() =>
                        user ? setPurchaseOpen(true) : navigate("/login", { state: { from: location.pathname } })
                      }
                    >
                      <WalletIcon className="w-4 h-4 ml-2" />
                      {user ? "شراء الحزمة" : "سجّل الدخول للشراء"}
                    </Button>
                  )}

                  {!price.isFree && (
                    <p className="text-[11px] text-muted-foreground mt-3 text-center">
                      الدفع حاليًا عبر رصيد المحفظة — تُفعَّل جميع دورات الحزمة فورًا بعد الشراء.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          <section className="mt-12">
            <h2 className="text-xl md:text-2xl font-bold mb-6">دورات الحزمة</h2>
            {visibleCourses.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-border p-12 text-center">
                <Package className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                <p className="text-muted-foreground">لم تُضف دورات إلى هذه الحزمة بعد.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {visibleCourses.map((c, i) => (
                  <BundleCourseItem
                    key={c.course_id}
                    course={c.courses!}
                    enrolled={enrolledIds.has(c.course_id)}
                    index={i}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
      <Footer />

      <PurchaseBundleModal
        open={purchaseOpen}
        onOpenChange={setPurchaseOpen}
        bundleId={bundle.id}
        bundleTitle={bundle.title}
        amountPiastres={price.amount}
        originalPiastres={showDiscount ? price.originalAmount : null}
        coursesCount={visibleCourses.length}
        onPurchased={() => load()}
      />
    </div>
  );
};

function BundleCourseItem({
  course,
  enrolled,
  index,
}: {
  course: NonNullable<BundleCourse["courses"]>;
  enrolled: boolean;
  index: number;
}) {
  const thumb = useSignedThumbnail(course.thumbnail_url);
  const isPublished = course.status === "published";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
    >
      <Link
        to={`/courses/${course.id}`}
        className="group flex gap-4 rounded-2xl border border-border bg-card overflow-hidden shadow-sm hover:shadow-xl hover:border-primary/40 transition-all h-full"
      >
        <div className="relative w-32 sm:w-40 shrink-0 overflow-hidden bg-accent">
          {thumb ? (
            <img
              src={thumb}
              alt={course.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <BookOpen className="w-8 h-8 opacity-30" />
            </div>
          )}
        </div>
        <div className="py-4 pl-4 pr-1 flex flex-col flex-1 min-w-0">
          <h3 className="font-bold text-foreground line-clamp-1 mb-1">{course.title}</h3>
          <p className="text-xs text-muted-foreground line-clamp-2 flex-1">
            {course.description || "دورة تعليمية على المنصة"}
          </p>
          <div className="mt-2">
            {enrolled ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                مُسجَّل — ابدأ التعلم
              </span>
            ) : isPublished ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-primary">
                عرض الدورة
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                {course.status === "coming_soon" ? "قريبًا" : "غير منشورة"}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default BundleDetails;
