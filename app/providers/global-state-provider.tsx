"use client"
import React, { createContext, useContext, useState } from "react"

type StateContextProviderProps = {
    children: React.ReactNode;
}

type State = {
    counter: number
}

type StateContext = {
    saveState: (value: State) => void;
    currentState: State;
}

export const GlobalStateContext = createContext<StateContext | null>(null);

export default function GlobalStateContextProvider({ children }: StateContextProviderProps) {
    const [state, setState] = useState<State>({ counter: 0 });

    const saveState = (newState: State) => {
        setState(newState)
    }

    return <GlobalStateContext.Provider
        value={{
            currentState:state,
            saveState
        }}>
        {children}
    </GlobalStateContext.Provider>

}

export function useGlobalState() {
    const context = useContext(GlobalStateContext);
    if (!context) {
        throw new Error("useRouteState must be used within RouteStateContext");
    }
    return context;
}
