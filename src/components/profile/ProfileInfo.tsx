export const ProfileInfo = () => {
  return (
    <section className="flex flex-col items-center gap-4">
      {/* Profile Picture */}
      <div className="relative">
        <div className="w-28 h-28 rounded-full p-[3px] bg-gradient-to-tr from-primary to-emerald-600">
          <div 
            className="w-full h-full rounded-full border-4 border-background bg-muted bg-cover bg-center"
            style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuB18b2e4H8Vilu_1rtxonCQj9vAbC1EoysVCEWwBgUUgbOF-Bn6rkp0yDuDlhC79_hCKp-GBhEYsWYVUNvfnntM12RTwF5uu9JD6jn_qN37Woe4qQ5a7YR1CcruWB-DzMIG1d3H39Vzkuk62xFJV4y2aBs-rS2A3zj9NtTjH2DCUzCz_eveY6i6w4PFt7B2vJi13Ows29u2Vt-I0ROOVImcd5oa-LNy__PIB-223eqMByqUaHUp9I_EGjWk0NBo6Mk9BHdwc63_G10')" }}
            aria-label="Portrait of soccer player Lucas Silva smiling"
          />
        </div>
        <div className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1.5 border-4 border-background flex items-center justify-center">
          <span className="material-symbols-outlined text-[16px] font-bold">verified</span>
        </div>
      </div>

      {/* Name and Position */}
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-bold text-foreground leading-tight">Lucas Silva</h2>
        <p className="text-muted-foreground font-medium text-sm">Ponta Esquerda | São Paulo FC</p>
      </div>

      {/* Action Buttons */}
      <div className="flex w-full max-w-xs gap-3 mt-2">
        <button className="flex-1 bg-primary hover:bg-primary-dark text-primary-foreground h-11 rounded-xl font-bold text-sm tracking-wide transition-colors flex items-center justify-center gap-2 shadow-primary-glow">
          <span className="material-symbols-outlined text-[20px]">person_add</span>
          Seguir
        </button>
        <button className="flex-1 bg-background hover:bg-muted text-foreground h-11 rounded-xl font-bold text-sm tracking-wide transition-colors border border-border flex items-center justify-center gap-2 shadow-sm">
          <span className="material-symbols-outlined text-[20px]">chat</span>
          Mensagem
        </button>
      </div>

      {/* Physical Stats */}
      <div className="grid grid-cols-4 gap-2 bg-card rounded-2xl p-3 border border-border shadow-sm w-full mt-2">
        <div className="flex flex-col gap-1 p-2 text-center">
          <p className="text-foreground text-sm font-bold">22</p>
          <p className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">Idade</p>
        </div>
        <div className="flex flex-col gap-1 p-2 border-l border-border text-center">
          <p className="text-foreground text-sm font-bold">1.82m</p>
          <p className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">Altura</p>
        </div>
        <div className="flex flex-col gap-1 p-2 border-l border-border text-center">
          <p className="text-foreground text-sm font-bold">78kg</p>
          <p className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">Peso</p>
        </div>
        <div className="flex flex-col gap-1 p-2 border-l border-border text-center">
          <p className="text-foreground text-sm font-bold">Direito</p>
          <p className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">Pé</p>
        </div>
      </div>
    </section>
  );
};
