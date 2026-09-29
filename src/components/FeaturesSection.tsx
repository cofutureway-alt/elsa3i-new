import { motion } from "framer-motion";
import { BookOpen, ClipboardCheck, Users, Video, Award, Clock, Sparkles } from "lucide-react";
import { IslamicDivider, EightPointStar } from "@/components/IslamicPatterns";

const features = [
  {
    icon: Video,
    title: "دروس مباشرة وتفاعلية",
    desc: "حضور المحاضرات مباشرة مع المعلم، مع إمكانية التفاعل وطرح الأسئلة والإجابة عنها فوريًا.",
  },
  {
    icon: ClipboardCheck,
    title: "اختبارات تفاعلية",
    desc: "اختبارات وتدريبات دورية لقياس مستوى الاستيعاب وتثبيت العلوم مع التقييم الفوري.",
  },
  {
    icon: Users,
    title: "متابعة إشرافية مستمرة",
    desc: "متابعة فردية وتواصل دائم لكل طالب لضمان الاستمرارية وتحقيق أفضل نتائج.",
  },
  {
    icon: BookOpen,
    title: "مناهج متنوعة ومؤصلة",
    desc: "مناهج شرعية شمولية ومدروسة تغطي مختلف العلوم الإسلامية بأسلوب ميسر.",
  },
  {
    icon: Award,
    title: "شهادات إتمام معتمدة",
    desc: "شهادات إتمام موثقة تُمنح للطالب عند اجتياز كل مستوى دراسي بنجاح.",
  },
  {
    icon: Clock,
    title: "مرونة كاملة في الوقت",
    desc: "إمكانية مراجعة ومتابعة جميع الدروس واللقاءات المسجلة في أي وقت يناسبك 24/7.",
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

const FeaturesSection = () => {
  return (
    <section id="features" className="py-20 md:py-28 relative overflow-hidden bg-background">
      {/* Subtle Ambient Background Light */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Floating Corner Ornaments */}
      <EightPointStar
        size={44}
        className="absolute top-12 right-[6%] text-primary/10 pointer-events-none hidden md:block"
      />
      <EightPointStar
        size={36}
        className="absolute bottom-12 left-[6%] text-primary/10 pointer-events-none hidden md:block"
      />

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
          <IslamicDivider className="mb-4" />

          <motion.div
            initial={{ opacity: 0, y: -8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-primary shadow-sm"
          >
            <Sparkles size={13} />
            <span>بيئة تعليمية متكاملة</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight"
          >
            مميزات المنصة
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.08 }}
            className="text-base text-muted-foreground leading-relaxed"
          >
            نوفر لك بيئة تعليمية تفاعلية وميسرة لمتابعة الدروس والعلوم الشرعية مع المعلم
          </motion.p>
        </div>

        {/* Simple 6 Cards Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
        >
          {features.map((f) => (
            <motion.div
              key={f.title}
              variants={cardVariants}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="group rounded-2xl bg-card/70 backdrop-blur-sm border border-border/80 hover:border-primary/40 transition-all duration-300 p-6 shadow-sm hover:shadow-md flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <f.icon size={24} />
                </div>

                <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                  {f.title}
                </h3>

                <p className="text-sm text-muted-foreground leading-relaxed">
                  {f.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturesSection;



