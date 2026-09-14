import StatusBadge from './StatusBadge'

export default function StatusSelect({ status, options, onChange, size = 'sm', disabled = false }) {
  const handleCycle = (e) => {
    e.stopPropagation()
    if (disabled) return
    const currentIndex = options.indexOf(status)
    const nextIndex = (currentIndex + 1) % options.length
    onChange(options[nextIndex])
  }

  return (
    <div 
      onClick={handleCycle}
      className={`${disabled ? 'cursor-default' : 'cursor-pointer hover:opacity-80 active:scale-95'} transition-opacity select-none inline-block transform duration-100`}
      title={disabled ? 'Final status' : 'Click to change status'}
    >
      <StatusBadge status={status} size={size} />
    </div>
  )
}
