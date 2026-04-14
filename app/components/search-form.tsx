'use client'

export default function SearchForm({
  value,
  onChange,
  onSubmit,
  isLoading = false,
}: {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  isLoading?: boolean
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit()
      }}
      className="relative"
    >
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search a word"
        disabled={isLoading}
        className="w-full rounded border px-3 py-2 pr-10 disabled:opacity-50"
      />
      {isLoading && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2">
          <svg
            className="h-4 w-4 animate-spin text-gray-400"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            />
          </svg>
        </span>
      )}
    </form>
  )
}
