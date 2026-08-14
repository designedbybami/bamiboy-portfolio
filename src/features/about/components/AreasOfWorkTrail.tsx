"use client";

import Image from "next/image";
import { ImageTrail, ImageTrailItem } from "@/shared/ui/ImageTrail";
import { areasOfWork } from "../areas-of-work-data";

const ROTATIONS = [-6, 5, -4, 7, -8, 3, -3, 6, -5, 8];

export function AreasOfWorkTrail() {
  return (
    <ImageTrail
      className="absolute inset-0"
      threshold={90}
      intensity={0.35}
      keyframes={{ scale: [0, 1, 1, 0] }}
      keyframesOptions={{ duration: 1, times: [0, 0.1, 0.85, 1] }}
    >
      {areasOfWork.map((area, index) => (
        <ImageTrailItem
          key={area.label}
          style={{ rotate: `${ROTATIONS[index % ROTATIONS.length]}deg` }}
          className="w-24 rounded-sm bg-paper p-1.5 pb-5 shadow-xl shadow-ink/20 sm:w-28"
        >
          <div className="relative aspect-[4/5] w-full overflow-hidden bg-ink/5">
            <Image src={area.image} alt={area.label} fill sizes="120px" className="object-cover" />
          </div>
          <p className="mt-1 text-center font-hand text-lg leading-none text-ink sm:text-xl">{area.label}</p>
        </ImageTrailItem>
      ))}
    </ImageTrail>
  );
}
