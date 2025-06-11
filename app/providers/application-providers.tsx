import { JSX, ReactNode } from 'react';
import GlobalStateContextProvider from './global-state-provider';

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
  const providers: Provider[] = [GlobalStateContextProvider];

  return composeProviders(providers, children);
};
