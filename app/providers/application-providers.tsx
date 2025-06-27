"use client"

import { JSX, ReactNode } from 'react';
import GlobalStateContextProvider from './global-state-provider';
import { SessionProvider } from 'next-auth/react';

type ProviderProps = {
  children: ReactNode
}

type Provider = ({ children }: ProviderProps) => JSX.Element;

const composeProviders = (providers: Provider[], children: ReactNode) => {
  return providers.reduceRight((acc, ProviderComponent) => {
    return <ProviderComponent>{acc}</ProviderComponent>;
  }, children);
};

export const AppProviders = ({ children }: ProviderProps) => {
  const providers: Provider[] = [
    GlobalStateContextProvider,
    ({ children }) => (
      <SessionProvider
        // Prevent automatic redirects when session is loading
        refetchOnWindowFocus={false}
        refetchInterval={0}
        // Disable background refetching
        refetchWhenOffline={false}
      >
        {children}
      </SessionProvider>
    )
  ];

  return composeProviders(providers, children);
};
