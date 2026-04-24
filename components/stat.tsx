type Props = { value: string; label: string };

export function Stat({ value, label }: Props) {
  return (
    <div className="border-t border-hairline pt-5">
      <p className="font-serif text-4xl md:text-5xl tracking-[-0.025em] text-ink leading-none">
        {value}
      </p>
      <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.28em] text-mute">
        {label}
      </p>
    </div>
  );
}

export function StatGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 my-14">
      {children}
    </div>
  );
}
