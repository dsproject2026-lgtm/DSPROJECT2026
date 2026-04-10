interface AuthBrandProps {
  flicker?: boolean;
  showText?: boolean;
}

export function AuthBrand({ flicker = false, showText = true }: AuthBrandProps) {
  return (
    <div className={`mx-auto flex flex-col items-center text-center ${showText ? 'mb-7 sm:mb-8' : 'mb-0'}`}>
      <div className={flicker ? 'animate-logo-flicker' : ''}>
        <img alt="SIVO-UP" className="h-[86px] w-[86px] object-contain sm:h-[98px] sm:w-[98px]" src="/images/logo.svg" />
      </div>
      {showText ? (
        <>
          <h1 className="mt-5 text-[2.45rem] font-bold tracking-tight text-[#0D1D43] sm:text-[2.65rem]">SIVO-UP</h1>
          <p className="mt-2 max-w-[22rem] text-[0.86rem] font-medium uppercase tracking-[0.27em] text-[#8A909D] sm:text-[0.92rem]">
            Sistema de votacao da Universidade Pedagogica
          </p>
        </>
      ) : null}
    </div>
  );
}
