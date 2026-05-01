"use client";

import { useEffect, useState } from 'react'

export const initializeMSW = async () => {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    try {
      const { worker } = await import('../mocks/browser')
      await worker.start({
        onUnhandledRequest: 'bypass',
        serviceWorker: {
          url: '/mockServiceWorker.js'
        }
      })
      console.log('MSW started successfully')
    } catch (error) {
      console.error('Failed to start MSW:', error)
    }
  }
}

export const MSWInit = () => {
  useEffect(() => {
    initializeMSW();
  }, [])

  return null
}