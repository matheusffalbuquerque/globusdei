/**
 * Main index portal for the GlobusDei application representing classic minimalism.
 */
export default function Index() {
  return (
    <div className="max-w-4xl py-12">
      <h1 className="font-display text-5xl font-bold tracking-tight text-foreground mb-6">
        Conectando Missões <br />
        <span className="text-primary">Ao Redor do Globo</span>
      </h1>
      <p className="text-xl text-muted-foreground mb-12 max-w-2xl leading-relaxed">
        A plataforma Globus Dei facilita a conexão entre agentes missionários, empreendimentos e investidores de forma transparente.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
        <div className="border border-border rounded p-8 bg-white shadow-sm hover:border-primary/30 transition-colors">
          <h2 className="font-display font-semibold text-2xl mb-3 text-foreground">Agentes</h2>
          <p className="text-base text-muted-foreground">
            Descubra e conecte-se com missionários e voluntários qualificados buscando apoio logístico e financeiro.
          </p>
        </div>
        
        <div className="border border-border rounded p-8 bg-white shadow-sm hover:border-primary/30 transition-colors">
          <h2 className="font-display font-semibold text-2xl mb-3 text-foreground">Empreendimentos</h2>
          <p className="text-base text-muted-foreground">
            Apoie projetos e iniciativas com alta transparência de impacto e acompanhamento financeiro dedicado.
          </p>
        </div>
      </div>
    </div>
  );
}
