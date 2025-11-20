import { useState } from 'react'
import { X } from 'lucide-react'
import type { MeetingOutcome } from '../../stores/CalendarStore'

interface AddOutcomeModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (outcome: MeetingOutcome) => Promise<void>
  eventTitle?: string
}

const AddOutcomeModal = ({ isOpen, onClose, onSubmit, eventTitle }: AddOutcomeModalProps) => {
  const [summary, setSummary] = useState('')
  const [nextSteps, setNextSteps] = useState('')
  const [sentimentScore, setSentimentScore] = useState(50)
  const [keyDecisions, setKeyDecisions] = useState('')
  const [followUpRequired, setFollowUpRequired] = useState(false)
  const [followUpDate, setFollowUpDate] = useState(() => {
    const date = new Date()
    date.setDate(date.getDate() + 7)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  })
  const [meetingRating, setMeetingRating] = useState<1 | 2 | 3 | 4 | 5>(3)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!summary.trim() || !nextSteps.trim()) {
      return
    }

    setIsSubmitting(true)
    try {
      const outcome: MeetingOutcome = {
        summary: summary.trim(),
        nextSteps: nextSteps.split('\n').map(s => s.trim()).filter(Boolean),
        sentimentScore: sentimentScore - 50, // Convert 0-100 to -50 to 50
        keyDecisions: keyDecisions.split('\n').map(s => s.trim()).filter(Boolean),
        followUpRequired,
        followUpDate: followUpRequired ? new Date(followUpDate) : undefined,
        meetingRating,
      }

      await onSubmit(outcome)

      // Reset form
      setSummary('')
      setNextSteps('')
      setSentimentScore(50)
      setKeyDecisions('')
      setFollowUpRequired(false)
      const date = new Date()
      date.setDate(date.getDate() + 7)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      setFollowUpDate(`${year}-${month}-${day}`)
      setMeetingRating(3)
      onClose()
    } catch (error) {
      console.error('Error adding outcome:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setSummary('')
      setNextSteps('')
      setSentimentScore(50)
      setKeyDecisions('')
      setFollowUpRequired(false)
      const date = new Date()
      date.setDate(date.getDate() + 7)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      setFollowUpDate(`${year}-${month}-${day}`)
      setMeetingRating(3)
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-card z-10">
          <div>
            <h2 className="text-xl font-semibold text-card-foreground">
              Add Meeting Outcome
            </h2>
            {eventTitle && (
              <p className="text-sm text-muted-foreground mt-1">{eventTitle}</p>
            )}
          </div>
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
          {/* Summary */}
          <div>
            <label htmlFor="summary" className="block text-sm font-medium text-foreground mb-2">
              Meeting Summary <span className="text-destructive">*</span>
            </label>
            <textarea
              id="summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Enter a summary of the meeting"
              rows={4}
              required
              disabled={isSubmitting}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors resize-none disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Next Steps */}
          <div>
            <label htmlFor="nextSteps" className="block text-sm font-medium text-foreground mb-2">
              Next Steps <span className="text-destructive">*</span>
            </label>
            <textarea
              id="nextSteps"
              value={nextSteps}
              onChange={(e) => setNextSteps(e.target.value)}
              placeholder="Enter next steps, one per line"
              rows={4}
              required
              disabled={isSubmitting}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors resize-none disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <p className="text-xs text-muted-foreground mt-1">Enter one next step per line</p>
          </div>

          {/* Key Decisions */}
          <div>
            <label htmlFor="keyDecisions" className="block text-sm font-medium text-foreground mb-2">
              Key Decisions
            </label>
            <textarea
              id="keyDecisions"
              value={keyDecisions}
              onChange={(e) => setKeyDecisions(e.target.value)}
              placeholder="Enter key decisions made, one per line"
              rows={3}
              disabled={isSubmitting}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors resize-none disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <p className="text-xs text-muted-foreground mt-1">Enter one decision per line</p>
          </div>

          {/* Sentiment Score and Meeting Rating */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="sentimentScore" className="block text-sm font-medium text-foreground mb-2">
                Sentiment Score: {sentimentScore > 50 ? '😊' : sentimentScore < 50 ? '😐' : '😊'} {sentimentScore}
              </label>
              <input
                id="sentimentScore"
                type="range"
                min="0"
                max="100"
                value={sentimentScore}
                onChange={(e) => setSentimentScore(parseInt(e.target.value))}
                disabled={isSubmitting}
                className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Negative</span>
                <span>Neutral</span>
                <span>Positive</span>
              </div>
            </div>

            <div>
              <label htmlFor="meetingRating" className="block text-sm font-medium text-foreground mb-2">
                Meeting Rating
              </label>
              <div className="flex items-center space-x-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => setMeetingRating(rating as 1 | 2 | 3 | 4 | 5)}
                    disabled={isSubmitting}
                    className={`w-10 h-10 rounded-lg border-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      meetingRating >= rating
                        ? 'bg-yellow-400 border-yellow-500 text-yellow-900'
                        : 'bg-background border-border text-muted-foreground hover:border-primary'
                    }`}
                  >
                    ⭐
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Follow-up Required */}
          <div className="flex items-center space-x-3">
            <input
              id="followUpRequired"
              type="checkbox"
              checked={followUpRequired}
              onChange={(e) => setFollowUpRequired(e.target.checked)}
              disabled={isSubmitting}
              className="w-4 h-4 rounded border-border text-primary focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <label htmlFor="followUpRequired" className="text-sm font-medium text-foreground">
              Follow-up Required
            </label>
          </div>

          {/* Follow-up Date */}
          {followUpRequired && (
            <div>
              <label htmlFor="followUpDate" className="block text-sm font-medium text-foreground mb-2">
                Follow-up Date
              </label>
              <input
                id="followUpDate"
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                disabled={isSubmitting}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          )}

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
              disabled={isSubmitting || !summary.trim() || !nextSteps.trim()}
              className="px-4 py-2 bg-primary hover:bg-primary/90 rounded-lg text-primary-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Adding...' : 'Add Outcome'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddOutcomeModal

