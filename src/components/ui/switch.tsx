"use client"

import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, checked, onCheckedChange, ...props }, ref) => {
  const [isChecked, setIsChecked] = React.useState(checked || false)

  React.useEffect(() => {
    setIsChecked(checked || false)
  }, [checked])

  const handleCheckedChange = (newChecked: boolean) => {
    setIsChecked(newChecked)
    onCheckedChange?.(newChecked)
  }

  return (
    <SwitchPrimitives.Root
      className={cn(
        "peer inline-flex shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
        "!w-11 !h-6 !min-w-11 !max-w-11 !min-h-6 !max-h-6",
        className
      )}
      style={{
        backgroundColor: isChecked ? 'var(--primary)' : 'var(--input)',
        borderColor: 'transparent',
        transition: 'background-color 150ms ease'
      }}
      checked={isChecked}
      onCheckedChange={handleCheckedChange}
      {...props}
      ref={ref}
    >
      <SwitchPrimitives.Thumb
        className={cn(
          "pointer-events-none block rounded-full bg-background shadow-lg ring-0 transition-transform",
          "!w-5 !h-5 !min-w-5 !max-w-5 !min-h-5 !max-h-5"
        )}
        style={{
          backgroundColor: 'var(--background)',
          transform: isChecked ? 'translateX(20px)' : 'translateX(0px)',
          transition: 'transform 150ms ease'
        }}
      />
    </SwitchPrimitives.Root>
  )
})
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }
