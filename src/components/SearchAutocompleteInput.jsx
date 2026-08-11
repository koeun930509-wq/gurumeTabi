import { useState } from 'react'
import { suggestFoodTypes } from '../utils/searchTerms'

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

  const suggestions = suggestFoodTypes(value)

  function selectSuggestion(food) {
    onChange(food)
    setOpen(false)
    onSubmit(food)
  }

  return (
    <div className={wrapperClassName ?? 'relative'}>
      <input
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        placeholder={placeholder}
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
          {suggestions.map((food) => (
            <li key={food}>
              <button
                type="button"
                role="option"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => selectSuggestion(food)}
                className="w-full text-left text-sm px-4 py-2 text-gray-600 hover:bg-brand-peach/40 hover:text-brand-navy transition-colors"
              >
                {food}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
