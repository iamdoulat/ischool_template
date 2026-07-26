"use client";

import React, { useEffect, useState } from 'react'

let mswInitPromise: Promise<void> | null = null;

const isMswEnabled = process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_ENABLE_MSW === 'true';

export const initializeMSW = async (): Promise<void> => {
  if (typeof window !== 'undefined' && isMswEnabled) {
    if (!mswInitPromise) {
      mswInitPromise = (async () => {
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
      })();
    }
    return mswInitPromise;
  }
  return Promise.resolve();
}

export const MSWInit = ({ children }: { children?: React.ReactNode }) => {
  const [mswReady, setMswReady] = useState(!isMswEnabled);

  useEffect(() => {
    if (isMswEnabled) {
      initializeMSW().then(() => {
        setMswReady(true);
      });
    } else if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Unregister any active mockServiceWorker so browser requests go directly to Laravel API
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          if (registration.active?.scriptURL.includes('mockServiceWorker.js')) {
            registration.unregister();
            console.log('Unregistered mockServiceWorker to enable direct Laravel API calls');
          }
        }
      });
    }
  }, []);

  if (isMswEnabled && !mswReady) {
    return null;
  }

  return <>{children}</>;
}

