type ColophonProps = {
  numeral: string;
};

export default function Colophon({ numeral }: ColophonProps) {
  return (
    <div className="mt-24 mb-16 text-center">
      <div className="mx-auto w-[30%] border-t border-hairline mb-6" />
      <div className="font-serif italic text-sepia text-2xl mb-3">❦</div>
      <div className="font-serif italic text-mute/80 text-[14px] tracking-tight">
        {`Codex Ahmed · ${numeral} · Editio prima · MMXXVI`}
      </div>
    </div>
  );
}
