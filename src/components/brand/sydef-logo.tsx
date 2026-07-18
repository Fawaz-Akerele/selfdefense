import Image from "next/image";

type SydefLogoProps = {
  className?: string;
  showWordmark?: boolean;
  size?: "sm" | "md" | "lg";
};

const sizes = { sm: 36, md: 48, lg: 64 };

export function SydefLogo({ className = "", showWordmark = true, size = "md" }: SydefLogoProps) {
  const px = sizes[size];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div
        className="relative shrink-0 overflow-hidden rounded-full"
        style={{ width: px, height: px }}
      >
        <Image
          src="/sydef-logo.png"
          alt=""
          width={px}
          height={Math.round(px * 2.4)}
          className="object-cover object-top"
          aria-hidden
        />
      </div>
      {showWordmark && (
        <div>
          <p className="text-lg font-bold tracking-[0.18em] text-neutral-900">SYDEF</p>
          <p className="text-[10px] uppercase tracking-[0.22em] text-neutral-500">
            Psychology of Self Defence
          </p>
        </div>
      )}
    </div>
  );
}
