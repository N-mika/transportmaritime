import { ReactNode } from "react";

interface HeaderSectionProps {
  title: string;
  subtitle: string;
  actions?: ReactNode; // pour passer des boutons ou un menu
}

export function HeaderSection({ title, subtitle, actions }: HeaderSectionProps) {
  return (
    <div className="mb-8 w-full items-center min-h-[100px] sticky z-40 border-b-2 py-4 px-2 top-0 bg-white flex flex-col sm:flex-row justify-between gap-4">
      
      {/* Bloc Titre */}
      <div className="flex flex-col text-center sm:text-left">
        <h2 className="text-xl sm:text-2xl font-semibold text-primary mb-1">{title}</h2>
        <p className="text-muted-foreground text-sm sm:text-base">{subtitle}</p>
      </div>
      
      {/* Bloc Actions */}
      {actions && (
        <div className="flex flex-wrap gap-2 justify-center sm:justify-end">
          {actions}
        </div>
      )}
    </div>
  );
}
