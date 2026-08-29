import erdaIcon from '../assets/icons/sol_erda.png'
import fragmentIcon from '../assets/icons/sol_erda_fragment.png'

const RESOURCES = {
  solErda: { src: erdaIcon, label: 'Sol Erda' },
  fragments: { src: fragmentIcon, label: 'Sol Erda Fragment' },
}

export default function ResourceAmount({ kind, value, size = 16, className = '' }) {
  const resource = RESOURCES[kind]
  if (!resource) return null

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <img
        src={resource.src}
        alt={resource.label}
        title={resource.label}
        width={size}
        height={size}
        className="shrink-0"
      />
      <span className="font-semibold tabular-nums">
        {value.toLocaleString('en-US')}
      </span>
    </span>
  )
}
