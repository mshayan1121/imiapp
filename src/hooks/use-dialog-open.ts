'use client'

import { useEffect, useState } from 'react'

/**
 * Hook to detect if any Radix UI Dialog is currently open
 * by checking for dialog content elements with open state
 */
export function useDialogOpen() {
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  useEffect(() => {
    // Check if any dialog content elements exist and are open
    const checkDialogs = () => {
      // Check for Radix UI dialog content elements (both data-slot and data-state attributes)
      const dialogContents = document.querySelectorAll(
        '[data-slot="dialog-content"], [data-slot="alert-dialog-content"], [data-slot="sheet-content"]'
      )
      const hasOpenDialog = Array.from(dialogContents).some(
        (el) => el.getAttribute('data-state') === 'open'
      )
      
      // Also check if body has aria-hidden (indicates a modal is open)
      const bodyHasAriaHidden = document.body.getAttribute('aria-hidden') === 'true'
      
      setIsDialogOpen(hasOpenDialog || bodyHasAriaHidden)
    }

    // Initial check
    checkDialogs()

    // Observe mutations to detect dialog state changes
    const observer = new MutationObserver(() => {
      checkDialogs()
    })

    // Observe the document body for aria-hidden changes
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['aria-hidden'],
      subtree: true,
    })

    // Observe dialog content elements directly for state changes
    const checkAndObserveDialogs = () => {
      const dialogContents = document.querySelectorAll(
        '[data-slot="dialog-content"], [data-slot="alert-dialog-content"], [data-slot="sheet-content"]'
      )
      
      dialogContents.forEach((el) => {
        observer.observe(el, {
          attributes: true,
          attributeFilter: ['data-state'],
        })
      })
    }

    // Initial observation setup
    checkAndObserveDialogs()

    // Periodically check for new dialogs and update observers
    const interval = setInterval(() => {
      checkDialogs()
      checkAndObserveDialogs()
    }, 100)

    return () => {
      observer.disconnect()
      clearInterval(interval)
    }
  }, [])

  return isDialogOpen
}
