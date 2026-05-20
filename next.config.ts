import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next.js 16 enforces a whitelist of allowed image quality values via
  // the image optimizer. Anything outside the list is rejected in
  // production (the optimizer returns 400 and the image fails to render).
  // We use custom qualities for two hero photos:
  //   - portrait-berlin.jpg in <MuseumTransition/> at q=92
  //   - portrait-mug.jpg in <PortraitNiche/> at q=95
  // 75 is the default and must stay in the list for any Image without
  // an explicit quality prop.
  images: {
    qualities: [75, 92, 95],
  },
};

export default nextConfig;
