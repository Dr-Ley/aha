import { brand, navItems } from "./content";
import { focusRingDark } from "./styles";

export function PortfolioFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden border-t border-white/15 px-6 pb-10 pt-12 md:px-8">
      <p
        aria-hidden="true"
        className="font-display pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 select-none whitespace-nowrap text-[15vw] font-medium leading-none text-white/[0.05] md:text-[12vw]"
      >
        Solutions Architect
      </p>
      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-display text-lg font-semibold text-[#F5F0E6]">{brand.name}</p>
          <p className="mt-2 text-sm text-[#8A8478]">
            © {year} {brand.name}. All rights reserved.
          </p>
        </div>
        <nav aria-label="Footer">
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            {navItems.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  className={`${focusRingDark} text-sm text-[#B9B2A6] transition-colors duration-200 hover:text-[#F5F0E6]`}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}