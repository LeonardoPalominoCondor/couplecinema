// Logros en pareja: se calculan solos a partir de lo registrado.
export function computeAchievements(entries, uids) {
  const seen = entries.filter((e) => e.status === 'visto')
  const series = seen.filter((e) => e.type === 'tv')
  const both = seen.filter((e) => uids.every((u) => e.ratings?.[u] > 0))
  const same = both.filter((e) => new Set(uids.map((u) => e.ratings[u])).size === 1)
  const opposite = both.filter((e) => Math.abs(e.ratings[uids[0]] - e.ratings[uids[1] ?? uids[0]]) >= 3)
  const gems = both.filter((e) => uids.every((u) => e.ratings[u] === 5))
  const cine = seen.filter((e) => e.cine)
  const genres = new Set(seen.flatMap((e) => e.genres || []))
  const perMonth = {}
  seen.forEach((e) => {
    const d = e.watchedAt?.toDate?.()
    if (d) { const k = `${d.getFullYear()}-${d.getMonth()}`; perMonth[k] = (perMonth[k] || 0) + 1 }
  })
  const bestMonth = Math.max(0, ...Object.values(perMonth))
  const A = (id, emoji, title, desc, value, goal) => ({ id, emoji, title, desc, value: Math.min(value, goal), goal, done: value >= goal })
  return [
    A('primera', '🎟️', 'Primera función', 'Registren su primer título juntos', seen.length, 1),
    A('diez', '🍿', 'Diez y contando', 'Vean 10 títulos', seen.length, 10),
    A('cincuenta', '🎬', 'Medio centenar', 'Vean 50 títulos', seen.length, 50),
    A('cien', '🏆', 'Cinéfilos de leyenda', 'Vean 100 títulos', seen.length, 100),
    A('series3', '📺', 'Maratoneros', 'Terminen 3 series', series.length, 3),
    A('series10', '🛋️', 'Adictos a las series', 'Terminen 10 series', series.length, 10),
    A('criticos', '⭐', 'Críticos de sofá', 'Puntúen los dos 10 títulos', both.length, 10),
    A('gemelas', '💞', 'Almas gemelas', 'Pongan la misma nota en 5 títulos', same.length, 5),
    A('opuestos', '⚡', 'Gustos opuestos', 'Discrepen por 3+ estrellas en 3 títulos', opposite.length, 3),
    A('joyita', '💎', 'Joyita compartida', 'Pónganle 5 estrellas los dos a un título', gems.length, 1),
    A('cine1', '🎦', 'Cita de cine', 'Vayan una vez al cine', cine.length, 1),
    A('cine5', '🍫', 'Clientes frecuentes', 'Vayan 5 veces al cine', cine.length, 5),
    A('generos', '🧭', 'Sin fronteras', 'Vean 8 géneros distintos', genres.size, 8),
    A('mes', '🔥', 'Mes de locura', 'Vean 8 títulos en un solo mes', bestMonth, 8),
  ]
}
