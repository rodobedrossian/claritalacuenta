interface MobileHeaderProps {
  userName: string;
}

export const MobileHeader = ({ userName }: MobileHeaderProps) => {
  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border px-4 pt-safe pb-2 transition-all duration-300">
      <div className="flex items-center justify-between h-12">
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          Hola, <span className="text-primary">{userName}</span>
        </h1>
      </div>
    </header>
  );
};
