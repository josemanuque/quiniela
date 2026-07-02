import { useRef } from 'react'
import { Upload } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

interface Option {
  id: string
  label: string
  url: string
}

interface Props {
  userId: string
  googleUrl: string | null
  currentUrl: string | null
  onSelect: (url: string) => void
  onUpload: (file: File) => void
  isPending: boolean
}

function dicebear(style: string, seed: string) {
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(seed)}`
}

export function AvatarPicker({
  userId,
  googleUrl,
  currentUrl,
  onSelect,
  onUpload,
  isPending,
}: Props) {
  const { t } = useTranslation()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const options: Option[] = [
    ...(googleUrl ? [{ id: 'google', label: 'Google', url: googleUrl }] : []),
    { id: 'pixel-art', label: 'Pixel', url: dicebear('pixel-art', userId) },
    { id: 'bottts', label: 'Robot', url: dicebear('bottts', userId) },
    { id: 'fun-emoji', label: 'Emoji', url: dicebear('fun-emoji', userId) },
    { id: 'thumbs', label: 'Abstract', url: dicebear('thumbs', userId) },
  ]

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) onUpload(file)
    // Reset so re-selecting the same file fires onChange
    e.target.value = ''
  }

  return (
    <div className="flex gap-3 overflow-x-auto scrollbar-none pb-1">
      {/* Upload button — always first */}
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isPending}
        className="flex flex-col items-center gap-1.5 flex-shrink-0 group"
      >
        <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-dashed border-zinc-600 group-hover:border-zinc-400 transition-all bg-zinc-800/60 flex items-center justify-center">
          <Upload size={18} className="text-zinc-500 group-hover:text-zinc-300 transition-colors" />
        </div>
        <span className="text-[10px] text-zinc-500 group-hover:text-zinc-400">
          {t('profile.upload')}
        </span>
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleFileChange}
      />

      {options.map((opt) => {
        const isSelected = currentUrl?.split('?')[0] === opt.url.split('?')[0]
        return (
          <button
            key={opt.id}
            onClick={() => {
              onSelect(opt.url)
            }}
            disabled={isPending}
            className="flex flex-col items-center gap-1.5 flex-shrink-0 group"
          >
            <div
              className={cn(
                'w-14 h-14 rounded-full overflow-hidden border-2 transition-all',
                isSelected
                  ? 'border-emerald-400 ring-2 ring-emerald-400/30'
                  : 'border-zinc-700 group-hover:border-zinc-500'
              )}
            >
              <img
                src={opt.url}
                alt={opt.label}
                className="w-full h-full object-cover bg-zinc-800"
                referrerPolicy="no-referrer"
              />
            </div>
            <span className={cn('text-[10px]', isSelected ? 'text-emerald-400' : 'text-zinc-500')}>
              {opt.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
