import { AlertCircle } from 'lucide-react'

export const ErrorMessage = ({ 
  message, 
  onRetry 
}: { 
  message: string
  onRetry?: () => void 
}) => {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-6 max-w-md">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-destructive mb-1">Error</h3>
            <p className="text-sm text-muted-foreground">{message}</p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="mt-3 px-4 py-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-lg text-sm transition-colors"
              >
                Try Again
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

