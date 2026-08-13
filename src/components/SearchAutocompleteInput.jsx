import { useState } from 'react'
import { suggestSearchTerms } from '../utils/searchTerms'

export default function SearchAutocompleteInput({
  value,
  onChange,
  onSubmit,
  placeholder,
  inputClassName,
  listClassName,
  wrapperClassName,
}) {
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)

  const suggestions = suggestSearchTerms(value)

  function selectSuggestion(term) {
    onChange(term)
    setOpen(false)
    setActiveIndex(-1)
    onSubmit(term)
  }

  function handleKeyDown(e) {
    if (!open || suggestions.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => (i + 1) % suggestions.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1))
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault()
      selectSuggestion(suggestions[activeIndex])
    } else if (e.key === 'Escape') {
      setOpen(false)
      setActiveIndex(-1)
    }
  }

  return (
    <div className={wrapperClassName ?? 'relative'}>
      <input
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          setOpen(true)
          setActiveIndex(-1)
        }}
        onKeyDown={handleKeyDown}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        placeholder={placeholder}
        role="combobox"
        aria-expanded={open && suggestions.length > 0}
        aria-autocomplete="list"
        className={inputClassName}
      />

      {open && suggestions.length > 0 && (
        <ul
          role="listbox"
          className={
            listClassName ??
            'absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl shadow-[0_8px_24px_-6px_rgba(109,40,217,0.3)] py-1.5 z-30 overflow-hidden'
          }
        >
          {suggestions.map((term, i) => (
            <li key={term}>
              <button
                type="button"
                role="option"
                aria-selected={i === activeIndex}
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setActiveIndex(i)}
                onClick={() => selectSuggestion(term)}
                className={`w-full text-left text-sm px-4 py-2 transition-colors ${
                  i === activeIndex
                    ? 'bg-brand-peach/40 text-brand-navy font-bold'
                    : 'text-gray-600 hover:bg-brand-peach/40 hover:text-brand-navy'
                }`}
              >
                {term}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
