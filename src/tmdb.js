const KEY = import.meta.env.VITE_TMDB_KEY
export const REGION = import.meta.env.VITE_REGION || 'PE'

async function call(path, params = {}) {
  const u = new URL('https://api.themoviedb.org/3' + path)
  u.searchParams.set('api_key', KEY)
  u.searchParams.set('language', 'es-MX')
  Object.entries(params).forEach(([k, v]) => v !== undefined && v !== '' && u.searchParams.set(k, v))
  const r = await fetch(u)
  if (!r.ok) throw new Error('TMDB ' + r.status)
  return r.json()
}

export const img = (p, size = 'w342') => (p ? `https://image.tmdb.org/t/p/${size}${p}` : null)

const norm = (x, type) => ({
  type: type || x.media_type,
  tmdbId: x.id,
  title: x.title || x.name,
  year: (x.release_date || x.first_air_date || '').slice(0, 4),
  poster: x.poster_path || null,
  backdrop: x.backdrop_path || null,
  overview: x.overview || '',
  vote: x.vote_average || 0,
  genres: x.genre_ids || (x.genres || []).map((g) => g.id),
})

export const search = async (q) =>
  (await call('/search/multi', { query: q })).results
    .filter((x) => x.media_type === 'movie' || x.media_type === 'tv')
    .map((x) => norm(x))

export const nowPlaying = async () => (await call('/movie/now_playing', { region: REGION })).results.map((x) => norm(x, 'movie'))

export async function details(type, id) {
  const d = await call(`/${type}/${id}`, { append_to_response: 'watch/providers' })
  const p = d['watch/providers']?.results?.[REGION] || {}
  return {
    ...norm(d, type),
    runtime: d.runtime || d.episode_run_time?.[0] || null,
    seasons: d.number_of_seasons || null,
    providers: { flatrate: p.flatrate || [], rent: p.rent || [], buy: p.buy || [] },
  }
}

export const discover = async (type, { genres, provider, page = 1 } = {}) =>
  (
    await call(`/discover/${type}`, {
      with_genres: genres?.length ? genres.join('|') : undefined,
      with_watch_providers: provider || undefined,
      watch_region: REGION,
      with_watch_monetization_types: provider ? 'flatrate' : undefined,
      sort_by: 'popularity.desc',
      'vote_count.gte': 200,
      page,
    })
  ).results.map((x) => norm(x, type))

// Estados de ánimo -> géneros de TMDB (películas / series)
export const MOODS = [
  { id: 'reir', label: '😂 Reírnos', movie: [35], tv: [35] },
  { id: 'amor', label: '🥰 Romántico', movie: [10749], tv: [18] },
  { id: 'adrenalina', label: '🔥 Adrenalina', movie: [28, 12], tv: [10759] },
  { id: 'miedo', label: '😱 Con miedito', movie: [27, 53], tv: [9648] },
  { id: 'relax', label: '🛋️ Relajados', movie: [16, 10751], tv: [16, 10751] },
  { id: 'pensar', label: '🧠 Pensar', movie: [878, 9648], tv: [10765, 9648] },
  { id: 'llorar', label: '😢 Llorar', movie: [18], tv: [18] },
]
export const PLATFORMS = [
  { id: 8, label: 'Netflix' },
  { id: 119, label: 'Prime Video' },
  { id: 337, label: 'Disney+' },
  { id: 1899, label: 'Max' },
  { id: 531, label: 'Paramount+' },
  { id: 350, label: 'Apple TV+' },
]
export const GENRES = {
  28: 'Acción', 12: 'Aventura', 16: 'Animación', 35: 'Comedia', 80: 'Crimen', 99: 'Documental', 18: 'Drama',
  10751: 'Familia', 14: 'Fantasía', 36: 'Historia', 27: 'Terror', 10402: 'Música', 9648: 'Misterio',
  10749: 'Romance', 878: 'Ciencia ficción', 53: 'Suspenso', 10752: 'Bélica', 37: 'Western',
  10759: 'Acción y aventura', 10765: 'Sci-Fi y fantasía', 10762: 'Infantil', 10764: 'Reality', 10766: 'Telenovela',
}
