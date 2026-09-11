export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-1">Dashboard</h1>
      <p className="text-zinc-400 text-sm mb-8">
        Visão geral dos seus negócios
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card title="Leads" value="—" hint="em breve" />
        <Card title="Negócios Abertos" value="—" hint="em breve" />
        <Card title="Receita no Mês" value="R$ —" hint="em breve" />
      </div>
    </div>
  );
}

function Card({
  title,
  value,
  hint,
}: {
  title: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-5">
      <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">
        {title}
      </p>
      <p className="text-2xl font-bold text-white mb-1">{value}</p>
      <p className="text-xs text-zinc-600">{hint}</p>
    </div>
  );
}