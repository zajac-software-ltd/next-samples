"use client"

import { useGlobalState } from "@/app/providers/global-state-provider";
import { Button } from "@/components/ui/button"

export const CLE: React.FC = () => {
  const { currentState: { counter }, saveState } = useGlobalState();
  return <Button onClick={() => { saveState({ counter: counter + 1 }) }}>Counter++ {counter}</Button>
}
