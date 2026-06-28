"use client";

import dynamic from "next/dynamic";

const ReseauContent = dynamic(() => import("@/components/reseau/ReseauContent"), { ssr: false });

export default function ReseauPage() {
  return <ReseauContent />;
}
