import type { NextConfig } from "next";
import createMDX from "@next/mdx";

const nextConfig: NextConfig = {
  pageExtensions: ["mdx", "md", "ts", "tsx"],
};

const withMDX = createMDX({
  options: {
    remarkPlugins: [["remark-gfm", {}]],
    rehypePlugins: [
      ["rehype-slug", {}],
      ["rehype-autolink-headings", { behavior: "wrap" }],
    ],
  },
});

export default withMDX(nextConfig);
