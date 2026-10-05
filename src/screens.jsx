import React, { useContext, useEffect, useMemo, useState } from 'react'
import { signOut } from 'firebase/auth'
import { auth } from './firebase'
import { Ctx, AVATARS } from './App.jsx'
import { saveProfile, saveEntry, removeEntry, entryId } from './db'
import { serverTimestamp } from 'firebase/firestore'
import { search, nowPlaying, details, discover, img, MOODS, PLATFORMS, GENRES } from './tmdb'
import { computeAchievements } from './achievements'

const useCtx = () => useContext(Ctx)
const avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0)

function Poster({ item, onClick, badge }) {
  return (
    <button className="poster" onClick={onClick}>
      {item.poster ? <img src={img(item.poster)} alt={item.title} loading="lazy" /> : <div className="noimg">{item.title}</div>}
      {badge && <span className="badge">{badge}</span>}
      <span className="ptitle">{item.title}</span>
    </button>
  )
}

function Stars({ value = 0, onChange, size = 28 }) {
  return (
    <div className="stars">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} disabled={!onChange} style={{ fontSize: size }} className={n <= value ? 'on' : ''} onClick={() => onChange?.(n === value ? 0 : n)}>★</button>
      ))}
    </div>
  )
}

function Who({ uid }) {
  const { members } = useCtx()
  return <span className="who" title={members[uid]?.username}>{members[uid]?.avatar || '🙂'}</span>
}

function useEntry(item) {
  const { entries } = useCtx()
  return entries.find((e) => e.id === entryId(item))
}

function Grid({ items, empty }) {
  const { openTitle, entries } = useCtx()
  if (!items.length) return <p className="empty">{empty}</p>
  return (
    <div className="grid">
      {items.map((m) => {
        const e = entries.find((x) => x.id === entryId(m))
        return <Poster key={m.type + m.tmdbId} item={m} onClick={() => openTitle(m)} badge={e?.status === 'visto' ? '✓' : e ? '🔖' : null} />
      })}
    </div>
  )
}

/* ---------- Inicio ---------- */
export function Home() {
  const { profile, partnerUid, members, entries, uids, openTitle } = useCtx()
  const [cartelera, setCartelera] = useState(null)
  useEffect(() => { nowPlaying().then(setCartelera).catch(() => setCartelera([])) }, [])
  const seen = entries.filter((e) => e.status === 'visto')
  const both = seen.filter((e) => uids.every((u) => e.ratings?.[u] > 0))
  const pending = entries.filter((e) => e.status === 'pendiente')
  const score = avg(both.flatMap((e) => uids.map((u) => e.ratings[u])))
  return (
    <>
      <header className="top">
        <div><h1>Hola, {profile.username}</h1><p className="muted">{partnerUid ? `Con ${members[partnerUid]?.username || '...'}` : 'Esperando a tu pareja…'}</p></div>
        <div className="duo"><span>{profile.avatar}</span>{partnerUid && <span>{members[partnerUid]?.avatar}</span>}</div>
      </header>
      <div className="stats">
        <div><b>{seen.length}</b><small>vistas</small></div>
        <div><b>{seen.filter((e) => e.type === 'tv').length}</b><small>series</small></div>
        <div><b>{score ? score.toFixed(1) : '–'}</b><small>nota media</small></div>
        <div><b>{pending.length}</b><small>por ver</small></div>
      </div>
      <h2>En cartelera</h2>
      {cartelera === null ? <div className="spinner" /> : (
        <div className="row">{cartelera.map((m) => <Poster key={m.tmdbId} item={m} onClick={() => openTitle({ ...m, fromCine: true })} />)}</div>
      )}
      {!!pending.length && (<>
        <h2>Pendientes de ver</h2>
        <div className="row">{pending.map((m) => <Poster key={m.id} item={m} onClick={() => openTitle(m)} />)}</div>
      </>)}
      {!seen.length && !pending.length && <p className="empty">Todavía no hay nada registrado. Busca una película o toca una de la cartelera para empezar.</p>}
    </>
  )
}

/* ---------- Buscar ---------- */
export function Search() {
  const [q, setQ] = useState('')
  const [res, setRes] = useState([])
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    if (q.trim().length < 2) { setRes([]); return }
    setBusy(true)
    const t = setTimeout(() => search(q).then(setRes).catch(() => setRes([])).finally(() => setBusy(false)), 350)
    return () => clearTimeout(t)
  }, [q])
  return (
    <>
      <h1>Buscar</h1>
      <input className="searchbox" autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Película o serie…" />
      {busy && <div className="spinner" />}
      <Grid items={res} empty={q.length < 2 ? 'Escribe el nombre de lo que vieron.' : busy ? '' : 'No encontramos resultados.'} />
    </>
  )
}

/* ---------- Descubrir ---------- */
export function Discover() {
  const { openTitle } = useCtx()
  const [type, setType] = useState('movie')
  const [mood, setMood] = useState(null)
  const [platform, setPlatform] = useState(null)
  const [list, setList] = useState([])
  const [pick, setPick] = useState(null)
  const [busy, setBusy] = useState(false)

  const load = async (randomPage) => {
    setBusy(true)
    const m = MOODS.find((x) => x.id === mood)
    const page = randomPage ? 1 + Math.floor(Math.random() * 8) : 1
    try {
      const r = await discover(type, { genres: m?.[type], provider: platform, page })
      setList(r); return r
    } catch { setList([]); return [] } finally { setBusy(false) }
  }
  useEffect(() => { load(false); setPick(null) }, [type, mood, platform])
  const surprise = async () => {
    const r = await load(true)
    if (r.length) { const p = r[Math.floor(Math.random() * r.length)]; setPick(await details(p.type, p.tmdbId)) }
  }
  return (
    <>
      <h1>Descubrir</h1>
      <div className="seg">
        <button className={type === 'movie' ? 'on' : ''} onClick={() => setType('movie')}>Películas</button>
        <button className={type === 'tv' ? 'on' : ''} onClick={() => setType('tv')}>Series</button>
      </div>
      <h3>¿Qué mood tienen hoy?</h3>
      <div className="chips">{MOODS.map((m) => <button key={m.id} className={mood === m.id ? 'on' : ''} onClick={() => setMood(mood === m.id ? null : m.id)}>{m.label}</button>)}</div>
      <h3>¿En qué plataforma?</h3>
      <div className="chips">{PLATFORMS.map((p) => <button key={p.id} className={platform === p.id ? 'on' : ''} onClick={() => setPlatform(platform === p.id ? null : p.id)}>{p.label}</button>)}</div>
      <button className="btn big dice" onClick={surprise} disabled={busy}>🎲 Sorpréndanme</button>
      {pick && (
        <div className="pick" onClick={() => openTitle(pick)}>
          {pick.poster && <img src={img(pick.poster)} alt="" />}
          <div>
            <h2>{pick.title}</h2>
            <p className="muted">{pick.year} · ⭐ {pick.vote.toFixed(1)}</p>
            <p className="clamp">{pick.overview}</p>
            <Providers p={pick.providers} compact />
          </div>
        </div>
      )}
      <h2>Recomendados</h2>
      {busy ? <div className="spinner" /> : <Grid items={list} empty="No hay resultados con esos filtros. Prueben quitando alguno." />}
    </>
  )
}

function Providers({ p, compact }) {
  if (!p) return null
  const none = !p.flatrate.length && !p.rent.length && !p.buy.length
  const Row = ({ label, list }) => list.length ? (
    <div className="prov"><small>{label}</small><div>{list.map((x) => <img key={x.provider_id} src={img(x.logo_path, 'w92')} title={x.provider_name} alt={x.provider_name} />)}</div></div>
  ) : null
  if (none) return <p className="muted small">Sin plataformas registradas en tu país.</p>
  return <div><Row label="Incluido en" list={p.flatrate} />{!compact && <><Row label="Alquiler" list={p.rent} /><Row label="Compra" list={p.buy} /></>}</div>
}

/* ---------- Nuestra lista ---------- */
export function Library() {
  const { entries, uids, openTitle } = useCtx()
  const [tab, setTab] = useState('visto')
  const [kind, setKind] = useState('all')
  const list = useMemo(() => entries
    .filter((e) => e.status === tab && (kind === 'all' || e.type === kind))
    .sort((a, b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0)), [entries, tab, kind])
  return (
    <>
      <h1>Nuestra lista</h1>
      <div className="seg">
        <button className={tab === 'visto' ? 'on' : ''} onClick={() => setTab('visto')}>Vistas</button>
        <button className={tab === 'pendiente' ? 'on' : ''} onClick={() => setTab('pendiente')}>Por ver</button>
      </div>
      <div className="chips">
        {[['all', 'Todo'], ['movie', 'Películas'], ['tv', 'Series']].map(([k, l]) => <button key={k} className={kind === k ? 'on' : ''} onClick={() => setKind(k)}>{l}</button>)}
      </div>
      {!list.length && <p className="empty">Aquí aparecerán los títulos que {tab === 'visto' ? 'vean' : 'guarden'}.</p>}
      {list.map((e) => (
        <button key={e.id} className="ticket" onClick={() => openTitle(e)}>
          {e.poster ? <img src={img(e.poster, 'w154')} alt="" /> : <div className="noimg sm" />}
          <div className="tinfo">
            <b>{e.title}</b>
            <small className="muted">{e.year} · {e.type === 'tv' ? 'Serie' : 'Película'}{e.cine ? ' · 🎦 cine' : ''}</small>
            {tab === 'visto' && <div className="rates">{uids.map((u) => <span key={u}><Who uid={u} /><Stars value={e.ratings?.[u] || 0} size={16} /></span>)}</div>}
          </div>
        </button>
      ))}
    </>
  )
}

/* ---------- Logros ---------- */
export function Achievements() {
  const { entries, uids } = useCtx()
  const list = computeAchievements(entries, uids)
  const done = list.filter((a) => a.done).length
  return (
    <>
      <h1>Logros en pareja</h1>
      <p className="muted">{done} de {list.length} desbloqueados</p>
      <div className="ach">
        {list.map((a) => (
          <div key={a.id} className={'achc ' + (a.done ? 'done' : '')}>
            <span className="em">{a.emoji}</span>
            <b>{a.title}</b>
            <small>{a.desc}</small>
            <div className="bar"><i style={{ width: `${(a.value / a.goal) * 100}%` }} /></div>
            <small>{a.value}/{a.goal}</small>
          </div>
        ))}
      </div>
    </>
  )
}

/* ---------- Perfil ---------- */
export function Profile() {
  const { user, profile, couple } = useCtx()
  const [username, setUsername] = useState(profile.username)
  const [avatar, setAvatar] = useState(profile.avatar)
  const dirty = username.trim() !== profile.username || avatar !== profile.avatar
  return (
    <>
      <h1>Tu perfil</h1>
      <div className="avatar-xl">{avatar}</div>
      <div className="avatar-grid">{AVATARS.map((a) => <button key={a} className={a === avatar ? 'on' : ''} onClick={() => setAvatar(a)}>{a}</button>)}</div>
      <label>Nombre de usuario</label>
      <input value={username} maxLength={20} onChange={(e) => setUsername(e.target.value)} />
      <button className="btn" disabled={!dirty || username.trim().length < 2} onClick={() => saveProfile(user.uid, { username: username.trim(), avatar })}>Guardar cambios</button>
      <div className="panel">
        <h3>Código de su espacio</h3>
        <div className="code">{couple.id}</div>
        <small className="muted">{couple.members.length < 2 ? 'Pásaselo a tu pareja para que se una.' : 'Ya están los dos conectados.'}</small>
      </div>
      <p className="muted small">Sesión: {user.email}</p>
      <button className="link" onClick={() => signOut(auth)}>Cerrar sesión</button>
    </>
  )
}

/* ---------- Ficha del título ---------- */
export function Sheet({ item, onClose }) {
  const { couple, user, uids, partnerUid } = useCtx()
  const entry = useEntry(item)
  const [d, setD] = useState(null)
  const [note, setNote] = useState('')
  useEffect(() => { details(item.type, item.tmdbId).then(setD).catch(() => setD(item)) }, [item.type, item.tmdbId])
  useEffect(() => { setNote(entry?.notes?.[user.uid] || '') }, [entry?.id])
  const m = d || item
  const save = (patch) => saveEntry(couple.id, m, patch)
  const mark = (status) => save({ status, ...(status === 'visto' && !entry?.watchedAt ? { watchedAt: serverTimestamp() } : {}), ...(item.fromCine && !entry ? { cine: true } : {}) })
  const myRating = entry?.ratings?.[user.uid] || 0
  return (
    <div className="overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <button className="close" onClick={onClose}>✕</button>
        {m.backdrop && <div className="hero" style={{ backgroundImage: `url(${img(m.backdrop, 'w780')})` }} />}
        <h2>{m.title}</h2>
        <p className="muted">{m.year}{m.runtime ? ` · ${m.runtime} min` : ''}{m.seasons ? ` · ${m.seasons} temp.` : ''} · {m.type === 'tv' ? 'Serie' : 'Película'}</p>
        <div className="chips ro">{(m.genres || []).slice(0, 4).map((g) => GENRES[g] && <span key={g}>{GENRES[g]}</span>)}</div>
        <p>{m.overview || 'Sin sinopsis disponible.'}</p>
        <h3>¿Dónde verla?</h3>
        {d ? <Providers p={d.providers} /> : <div className="spinner" />}
        <div className="seg">
          <button className={entry?.status === 'visto' ? 'on' : ''} onClick={() => mark('visto')}>✓ Ya la vimos</button>
          <button className={entry?.status === 'pendiente' ? 'on' : ''} onClick={() => mark('pendiente')}>🔖 Por ver</button>
        </div>
        {entry?.status === 'visto' && (<>
          <h3>Puntuaciones</h3>
          <div className="ratings">
            <div><Who uid={user.uid} /><Stars value={myRating} onChange={(n) => save({ ratings: { [user.uid]: n } })} /></div>
            {partnerUid && <div><Who uid={partnerUid} /><Stars value={entry?.ratings?.[partnerUid] || 0} /></div>}
          </div>
          <label className="check"><input type="checkbox" checked={!!entry.cine} onChange={(e) => save({ cine: e.target.checked })} /> Lo vimos en el cine</label>
          <label>Tu comentario (solo se ve el tuyo y el de tu pareja)</label>
          <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} onBlur={() => note !== (entry?.notes?.[user.uid] || '') && save({ notes: { [user.uid]: note } })} placeholder="¿Qué te pareció?" />
          {partnerUid && entry?.notes?.[partnerUid] && <p className="pnote"><Who uid={partnerUid} /> {entry.notes[partnerUid]}</p>}
        </>)}
        {entry && <button className="link danger" onClick={() => { removeEntry(couple.id, m); onClose() }}>Quitar de la lista</button>}
      </div>
    </div>
  )
}
