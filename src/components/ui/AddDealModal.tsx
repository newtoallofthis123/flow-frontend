import { useState, useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import { X } from 'lucide-react'
import { useStore } from '../../stores'
import type { DealStage } from '../../stores/DealsStore'

interface AddDealModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: {
    title: string
    contactId: string
    contactName: string
    company: string
    value: number
    stage: DealStage
    expectedCloseDate: Date
    description: string
    tags?: string[]
    priority: 'high' | 'medium' | 'low'
  }) => Promise<void>
}

const AddDealModal = observer(({ isOpen, onClose, onSubmit }: AddDealModalProps) => {
  const { contactsStore } = useStore()
  const [title, setTitle] = useState('')
  const [contactId, setContactId] = useState('')
  const [company, setCompany] = useState('')
  const [value, setValue] = useState('')
  const [stage, setStage] = useState<DealStage>('prospect')
  const [expectedCloseDate, setExpectedCloseDate] = useState(() => {
    // Default to 30 days from now
    const date = new Date()
    date.setDate(date.getDate() + 30)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  })
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState('')
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch contacts when modal opens
  useEffect(() => {
    if (isOpen && contactsStore.contacts.length === 0) {
      contactsStore.fetchContacts()
    }
  }, [isOpen, contactsStore])

  // Update company when contact changes
  useEffect(() => {
    if (contactId) {
      const contact = contactsStore.contacts.find(c => c.id === contactId)
      if (contact) {
        setCompany(contact.company)
      }
    }
  }, [contactId, contactsStore.contacts])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !contactId || !company.trim() || !value || !expectedCloseDate) {
      return
    }

    setIsSubmitting(true)
    try {
      const selectedContact = contactsStore.contacts.find(c => c.id === contactId)
      if (!selectedContact) {
        throw new Error('Selected contact not found')
      }

      await onSubmit({
        title: title.trim(),
        contactId,
        contactName: selectedContact.name,
        company: company.trim(),
        value: parseFloat(value),
        stage,
        expectedCloseDate: new Date(expectedCloseDate),
        description: description.trim(),
        tags: tags.trim() ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        priority,
      })
      // Reset form
      setTitle('')
      setContactId('')
      setCompany('')
      setValue('')
      setStage('prospect')
      const date = new Date()
      date.setDate(date.getDate() + 30)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      setExpectedCloseDate(`${year}-${month}-${day}`)
      setDescription('')
      setTags('')
      setPriority('medium')
      onClose()
    } catch (error) {
      console.error('Error adding deal:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setTitle('')
      setContactId('')
      setCompany('')
      setValue('')
      setStage('prospect')
      const date = new Date()
      date.setDate(date.getDate() + 30)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      setExpectedCloseDate(`${year}-${month}-${day}`)
      setDescription('')
      setTags('')
      setPriority('medium')
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-card z-10">
          <h2 className="text-xl font-semibold text-card-foreground">
            Add New Deal
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
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-foreground mb-2">
              Deal Title <span className="text-destructive">*</span>
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter deal title"
              required
              disabled={isSubmitting}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Contact */}
          <div>
            <label htmlFor="contactId" className="block text-sm font-medium text-foreground mb-2">
              Contact <span className="text-destructive">*</span>
            </label>
            <select
              id="contactId"
              value={contactId}
              onChange={(e) => setContactId(e.target.value)}
              required
              disabled={isSubmitting}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Select a contact</option>
              {contactsStore.contacts.map((contact) => (
                <option key={contact.id} value={contact.id}>
                  {contact.name} - {contact.company}
                </option>
              ))}
            </select>
          </div>

          {/* Company */}
          <div>
            <label htmlFor="company" className="block text-sm font-medium text-foreground mb-2">
              Company <span className="text-destructive">*</span>
            </label>
            <input
              id="company"
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Enter company name"
              required
              disabled={isSubmitting}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Value and Stage */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="value" className="block text-sm font-medium text-foreground mb-2">
                Value ($) <span className="text-destructive">*</span>
              </label>
              <input
                id="value"
                type="number"
                step="0.01"
                min="0"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="0.00"
                required
                disabled={isSubmitting}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label htmlFor="stage" className="block text-sm font-medium text-foreground mb-2">
                Stage <span className="text-destructive">*</span>
              </label>
              <select
                id="stage"
                value={stage}
                onChange={(e) => setStage(e.target.value as DealStage)}
                required
                disabled={isSubmitting}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="prospect">Prospect</option>
                <option value="qualified">Qualified</option>
                <option value="proposal">Proposal</option>
                <option value="negotiation">Negotiation</option>
                <option value="closed-won">Closed Won</option>
                <option value="closed-lost">Closed Lost</option>
              </select>
            </div>
          </div>

          {/* Expected Close Date */}
          <div>
            <label htmlFor="expectedCloseDate" className="block text-sm font-medium text-foreground mb-2">
              Expected Close Date <span className="text-destructive">*</span>
            </label>
            <input
              id="expectedCloseDate"
              type="date"
              value={expectedCloseDate}
              onChange={(e) => setExpectedCloseDate(e.target.value)}
              required
              disabled={isSubmitting}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Priority */}
          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-foreground mb-2">
              Priority
            </label>
            <select
              id="priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as 'high' | 'medium' | 'low')}
              disabled={isSubmitting}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-foreground mb-2">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter deal description"
              rows={3}
              disabled={isSubmitting}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors resize-none disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Tags */}
          <div>
            <label htmlFor="tags" className="block text-sm font-medium text-foreground mb-2">
              Tags
            </label>
            <input
              id="tags"
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Enter tags separated by commas"
              disabled={isSubmitting}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <p className="text-xs text-muted-foreground mt-1">Separate multiple tags with commas</p>
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
              disabled={isSubmitting || !title.trim() || !contactId || !company.trim() || !value || !expectedCloseDate}
              className="px-4 py-2 bg-primary hover:bg-primary/90 rounded-lg text-primary-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Adding...' : 'Add Deal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
})

export default AddDealModal

