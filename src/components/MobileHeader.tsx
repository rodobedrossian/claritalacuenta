interface MobileHeaderProps {
  userName: string;
}

export const MobileHeader = ({ userName }: MobileHeaderProps) => {
  return (
    <header className="sticky top-0 z-40 px-4 pt-safe pb-1" style={{ background: "var(--gradient-hero)" }}>
      <div className="flex items-center justify-between h-10">
        <h1 className="text-base font-bold tracking-tight text-white/90">
          Hola, <span className="text-white">{userName}</span>
        </h1>
      </div>
    </header>
  );
};
