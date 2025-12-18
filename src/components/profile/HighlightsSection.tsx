const highlights = [
  { 
    label: "Gols", 
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuC47FpKFmSGEkPwPU-W-S7W6aaphaefbGsEv-XLtJ19mYFCYJaqd3mX3TPf_34NTJd8XHWbCs8HpvymPBE1ELa-XkLEcGL-SO0KgxmTeu27YYxHjjOwVBGxiYp6eQL24PP0Bq44JSRB2d5f7O8HfnnUKL7U1Ovt1wT8E2r_1H4PFgU571jdc5ghyqVfcJgy54JCTtsTdYvZDCC1e9NPfL_QZspGS_AhcU_7MMcd8hm3tPLvBEpGjR_Dwlzdv5EGxjca34byUqD_dEk" 
  },
  { 
    label: "Treino", 
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDqXMO0OB6N2BUZfYejVK_dzhxQ89RZW5m6IoTKyWiI6Xl8bdGEdOzOBnGlkjvhDI2MRoLa3q6EPoZmZrnaOsXIQ2rC5_kpwnYVBvRyJ0uF3c2GE9U_JHkMUKEMEgRVO71iSU5XbybbrKH7379MsWSuvOWmv2-M3WcNkwMsGyrM0IwuJfRuK39EAkNVMvKLNGi1SakPJhYNQiBIlPmvEyZpsDA4L-oSBIjS3Eld87mQH1oKPB31E6H7CFMkJjVZF3BZ1CDJ7iEqcIg" 
  },
  { 
    label: "Jogos", 
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAUMuhsd_wabuGEjuNmzhuio_N9V7lx082Do7bMhBRuWMIhDYm4i0uYy8sp5gzujx41upWWGXR2o_wVCuLlsbaBkkPCMppoS9TpAqtqfdUOaIpV4Iejt8XO3kxkusPIhvICHwk84ep3BV-kVsdq18guoaBTmJ7ANUm-I_WxOc5cEeJaMFPTV9WTaIC9fXdcb5L3cJYcsSGU9MAxAi1nfQl_2N_lNRLxNZ27GwJeMGPCqRiRMUiRO_wVdrq7AtbODlIscK06UFVEvRc" 
  },
  { 
    label: "Prêmios", 
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCuWtfokmVLNBnTvFROB48vUshaqf00fzCyMWvWBo40Bh7lVFO0YmEd6qXN9cRATuVG-ZOt10pTJg03PkNvam5eEhewR-og_jC4LMFzogOppMpkUfm364BriDlRYgaYao9FxnacSgoYpciY7C0Lfk2V3ZMTNoYAHh9D_3TavYayHY9y2UEjPpwPVrjZSTA6zTCFHpeHnSyVrXAafCDobHYX8YHFnt7r9N_lxnMHdrfvu6jhQT11rV4SK1X3gOqnQhLr1zoXGKrIruw" 
  },
];

export const HighlightsSection = () => {
  return (
    <section>
      <h3 className="text-lg font-bold text-foreground mb-4 px-1">Destaques</h3>
      
      <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4">
        {highlights.map((highlight) => (
          <div key={highlight.label} className="flex-none w-20 flex flex-col gap-2 items-center">
            <div className="w-16 h-16 rounded-full p-[2px] bg-muted cursor-pointer hover:bg-primary transition-colors group">
              <div 
                className="w-full h-full rounded-full bg-cover bg-center border-2 border-background"
                style={{ backgroundImage: `url('${highlight.image}')` }}
                aria-label={highlight.label}
              />
            </div>
            <span className="text-xs text-foreground/80 truncate w-full text-center font-medium">{highlight.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
};
