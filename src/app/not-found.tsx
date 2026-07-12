"use client";

import { motion } from "framer-motion";
import { useSettings } from "@/components/providers/settings-provider";
import { useImageUrl } from "@/lib/image-url";
import { ArrowLeft, Home, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";

const floatVariants: any = {
  animate: (i: number) => ({
    y: [0, -14, 0, 8, 0],
    transition: {
      duration: 4 + i * 0.6,
      repeat: Infinity,
      ease: "easeInOut",
      delay: i * 0.25,
    },
  }),
};

const staggerContainer: any = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.2 },
  },
};

const fadeItem: any = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 100, damping: 18 },
  },
};

const cardGlow: any = {
  rest: { boxShadow: "0 8px 32px rgba(99, 102, 241, 0.08)" },
  hover: {
    boxShadow: "0 12px 48px rgba(99, 102, 241, 0.18)",
    transition: { duration: 0.4 },
  },
};

export default function NotFound() {
  const { settings } = useSettings();
  const getImageUrl = useImageUrl();
  const logoUrl = getImageUrl(settings.app_logo || settings.admin_logo);

  const digits = ["4", "0", "4"];

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#f8fafc] via-white to-[#eef2ff] relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-gradient-to-br from-[#FF9800]/8 to-[#6366F1]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-gradient-to-tr from-[#6366F1]/8 to-[#FF9800]/6 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-[#6366F1]/5 rounded-full blur-2xl pointer-events-none" />

      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.015] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(99,102,241,1) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <motion.div
        className="relative z-10 w-full max-w-lg mx-auto px-4"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {/* Logo */}
        <motion.div variants={fadeItem} className="flex justify-center mb-6">
          <Link href="/">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={settings.school_name}
                className="h-12 object-contain drop-shadow-sm"
              />
            ) : (
              <div className="flex items-center gap-2">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF9800] to-[#6366F1] text-white shadow-md">
                  <GraduationCap className="h-5 w-5" />
                </span>
                <span className="text-lg font-bold text-gray-800">
                  {settings.school_name}
                </span>
              </div>
            )}
          </Link>
        </motion.div>

        {/* Card */}
        <motion.div
          className="relative bg-white/75 backdrop-blur-xl rounded-2xl border border-gray-100/60 p-10 sm:p-12 text-center"
          variants={fadeItem}
          initial="rest"
          whileHover="hover"
          {...cardGlow}
        >
          {/* Animated 404 */}
          <div className="flex items-center justify-center gap-3 sm:gap-4 mb-6">
            {digits.map((d, i) => (
              <motion.span
                key={i}
                custom={i}
                variants={floatVariants}
                animate="animate"
                className={cn(
                  "inline-block text-[100px] sm:text-[130px] font-black leading-none select-none",
                  i === 0 && "text-[#FF9800]",
                  i === 1 && "text-[#6366F1]",
                  i === 2 && "text-[#FF9800]"
                )}
                style={{
                  textShadow:
                    i === 1
                      ? "0 4px 20px rgba(99,102,241,0.25)"
                      : "0 4px 20px rgba(255,152,0,0.2)",
                }}
              >
                {d}
              </motion.span>
            ))}
          </div>

          {/* Oops title */}
          <motion.div variants={fadeItem}>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
              Oops!
            </h1>
            <p className="text-sm text-gray-500 leading-relaxed max-w-xs mx-auto">
              This page seems to have wandered off — just like a student skipping
              class. Let&apos;s get you back on track.
            </p>
          </motion.div>

          {/* Divider */}
          <motion.div
            variants={fadeItem}
            className="my-6 mx-auto w-16 h-0.5 bg-gradient-to-r from-[#FF9800] to-[#6366F1] rounded-full"
          />

          {/* Home button */}
          <motion.div variants={fadeItem} whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Link href="/">
              <Button
                className={cn(
                  "h-11 px-7 text-sm font-bold rounded-full shadow-md",
                  "bg-gradient-to-r from-[#FF9800] to-[#6366F1]",
                  "hover:from-[#FF9800] hover:to-[#6366F1]",
                  "text-white flex items-center gap-2 mx-auto"
                )}
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </motion.div>

          {/* Small decorative line */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-[2px] bg-gradient-to-r from-transparent via-[#6366F1]/20 to-transparent rounded-full" />
        </motion.div>

        {/* Footer text */}
        <motion.p
          variants={fadeItem}
          className="text-center text-[11px] text-gray-400 mt-6"
        >
          {settings.school_name} &mdash; Page Not Found
        </motion.p>
      </motion.div>
    </div>
  );
}
