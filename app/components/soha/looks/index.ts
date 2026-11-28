import type { SohaKey } from "@/lib/soha-looks";
import type { SohaParts } from "../parts";
import { bozor } from "./bozor";
import { butik } from "./butik";
import { daftar } from "./daftar";
import { garaj } from "./garaj";
import { guldasta } from "./guldasta";
import { kitob } from "./kitob";
import { marafon } from "./marafon";
import { mayin } from "./mayin";
import { oynoqi } from "./oynoqi";
import { rozgor } from "./rozgor";
import { texno } from "./texno";
import { tuhfa } from "./tuhfa";
import { usta } from "./usta";
import { uy } from "./uy";

/** Each trade theme's parts; one file per theme, none knows of another. */
export const SOHA_PARTS: Record<SohaKey, SohaParts> = {
  bozor,
  usta,
  guldasta,
  mayin,
  oynoqi,
  texno,
  rozgor,
  kitob,
  marafon,
  tuhfa,
  uy,
  garaj,
  daftar,
  butik,
};
