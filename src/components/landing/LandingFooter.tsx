import { Instagram, Twitter, Youtube, Mail } from "lucide-react";
import logoText from "@/assets/soccervitae-logo-text.png";

const socialLinks = [
  { icon: Instagram, href: "#", label: "Instagram" },
  { icon: Twitter, href: "#", label: "Twitter" },
  { icon: Youtube, href: "#", label: "YouTube" }
];

const footerLinks = {
  produto: [
    { label: "Funcionalidades", href: "#features" },
    { label: "Para Atletas", href: "#" },
    { label: "Para Clubes", href: "#" },
    { label: "Para Olheiros", href: "#" }
  ],
  empresa: [
    { label: "Sobre Nós", href: "#" },
    { label: "Blog", href: "#" },
    { label: "Carreiras", href: "#" },
    { label: "Contato", href: "#" }
  ],
  legal: [
    { label: "Termos de Uso", href: "#" },
    { label: "Privacidade", href: "#" },
    { label: "Cookies", href: "#" }
  ]
};

export const LandingFooter = () => {
  return (
    <footer className="bg-muted/50 border-t border-border">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <img
              src={logoText}
              alt="Soccer Vitae"
              className="h-10 mb-4 brightness-0 dark:brightness-100"
            />
            <p className="text-muted-foreground mb-6 max-w-sm">
              A rede social que conecta atletas, técnicos e profissionais do 
              futebol ao redor do mundo.
            </p>
            <div className="flex gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Produto</h4>
            <ul className="space-y-3">
              {footerLinks.produto.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-4">Empresa</h4>
            <ul className="space-y-3">
              {footerLinks.empresa.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-4">Legal</h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} Soccer Vitae. Todos os direitos reservados.
          </p>
          <a
            href="mailto:contato@soccervitae.com"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            <Mail className="h-4 w-4" />
            contato@soccervitae.com
          </a>
        </div>
      </div>
    </footer>
  );
};
