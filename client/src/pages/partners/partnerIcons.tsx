import {
  Building2,
  CakeSlice,
  Camera,
  Flower2,
  Heart,
  Mic2,
  MoreHorizontal,
  Music,
  Palette,
  PartyPopper,
  Sparkles,
  Video,
  type LucideIcon,
} from "lucide-react";
import type { PartnerIconName } from "./partnersTypes";

export const PARTNER_ICON_COMPONENTS: Record<PartnerIconName, LucideIcon> = {
  sparkles: Sparkles,
  music: Music,
  mic: Mic2,
  camera: Camera,
  video: Video,
  building: Building2,
  flower: Flower2,
  cake: CakeSlice,
  party: PartyPopper,
  more: MoreHorizontal,
  heart: Heart,
  palette: Palette,
};
