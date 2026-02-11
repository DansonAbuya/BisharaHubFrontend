import * as React from 'react'

import { cn } from '@/lib/utils'

interface PageSectionProps extends React.HTMLAttributes<HTMLElement> {
  /**
   * Optional section header shown above the content.
   */
  title?: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
  contentClassName?: string
}

export function PageSection({
  title,
  description,
  actions,
  className,
  contentClassName,
  children,
  ...props
}: PageSectionProps) {
  const hasHeader = title || description || actions

  return (
    <section
      className={cn('space-y-4 sm:space-y-5', className)}
      {...props}
    >
      {hasHeader ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            {title ? (
              <h2 className="text-base sm:text-lg font-semibold text-foreground">
                {title}
              </h2>
            ) : null}
            {description ? (
              <p className="text-sm text-muted-foreground max-w-2xl">
                {description}
              </p>
            ) : null}
          </div>
          {actions ? (
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-end">
              {actions}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className={cn('space-y-4 sm:space-y-5', contentClassName)}>
        {children}
      </div>
    </section>
  )
}

