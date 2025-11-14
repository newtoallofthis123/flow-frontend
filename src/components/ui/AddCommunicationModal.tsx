import { useState } from 'react'
import { X } from 'lucide-react'

interface AddCommunicationModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: { subject: string; summary: string; occurred_at: string }) => Promise<void>
  contactName?: string
}

const AddCommunicationModal = ({ isOpen, onClose, onSubmit, contactName }: AddCommunicationModalProps) => {
  const [subject, setSubject] = useState('')
  const [summary, setSummary] = useState('')
  const [occurredAt, setOccurredAt] = useState(() => {
    // Default to current date/time
    const now = new Date()
    // Format as YYYY-MM-DDTHH:mm for datetime-local input
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!subject.trim() || !summary.trim()) {
      return
    }

    setIsSubmitting(true)
    try {
      // Convert datetime-local format to ISO string
      const occurredAtISO = new Date(occurredAt).toISOString()
      await onSubmit({
        subject: subject.trim(),
        summary: summary.trim(),
        occurred_at: occurredAtISO,
      })
      // Reset form
      setSubject('')
      setSummary('')
      onClose()
    } catch (error) {
      console.error('Error adding communication:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setSubject('')
      setSummary('')
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-card-foreground">
            Add Communication{contactName && ` - ${contactName}`}
          </h2>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-1 hover:bg-secondary rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Subject */}
          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-foreground mb-2">
              Subject <span className="text-destructive">*</span>
            </label>
            <input
              id="subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter communication subject"
              required
              disabled={isSubmitting}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Summary */}
          <div>
            <label htmlFor="summary" className="block text-sm font-medium text-foreground mb-2">
              Summary <span className="text-destructive">*</span>
            </label>
            <textarea
              id="summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Enter communication summary"
              required
              rows={4}
              disabled={isSubmitting}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors resize-none disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Occurred At */}
          <div>
            <label htmlFor="occurred_at" className="block text-sm font-medium text-foreground mb-2">
              Occurred At <span className="text-destructive">*</span>
            </label>
            <input
              id="occurred_at"
              type="datetime-local"
              value={occurredAt}
              onChange={(e) => setOccurredAt(e.target.value)}
              required
              disabled={isSubmitting}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-lg text-secondary-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !subject.trim() || !summary.trim()}
              className="px-4 py-2 bg-primary hover:bg-primary/90 rounded-lg text-primary-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Adding...' : 'Add Communication'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddCommunicationModal

