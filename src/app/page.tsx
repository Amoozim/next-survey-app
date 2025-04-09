'use client'

import Story from "@/components/Story/Story";
import { useState } from "react";

export default function Home() {
  const [toggle, setToggle] = useState<boolean>(false)

  return (
    <div className="h-screen flex flex-col-reverse gap-4 items-center justify-center relative">
      <Story toggle={toggle} setToggle={setToggle} />
      <div
        onClick={() => setToggle(true)}
        className="rounded-full size-12 border-2 border-red-400"></div>
    </div>
  );
}