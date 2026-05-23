import { type JSX, type ReactNode, createContext, useContext, useMemo, useState } from 'react'
import type { SpecificationTab } from '../types'

interface SpecificationContextValue {
    activeTab: SpecificationTab
    setActiveTab: (tab: SpecificationTab) => void
}

const SpecificationContext = createContext<SpecificationContextValue | null>(null)

export const SpecificationProvider = ({ children }: { children: ReactNode }): JSX.Element => {
    const [activeTab, setActiveTab] = useState<SpecificationTab>('documents')

    const value = useMemo(() => ({ activeTab, setActiveTab }), [activeTab])

    return <SpecificationContext.Provider value={value}>{children}</SpecificationContext.Provider>
}

export const useSpecification = (): SpecificationContextValue => {
    const ctx = useContext(SpecificationContext)
    if (!ctx) throw new Error('useSpecification must be used inside SpecificationProvider')
    return ctx
}
