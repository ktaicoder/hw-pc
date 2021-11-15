import { createContext } from 'react'

type SetStateAction<S> = S | ((prevState: S) => S)
type Dispatch<A> = (value: A) => void

type MainLayoutContextData = {
    setHwKind: Dispatch<SetStateAction<'all' | 'serial' | 'bluetooth'>>
    hwKind: 'all' | 'serial' | 'bluetooth'
    searchQuery?: string
    setSearchQuery: Dispatch<SetStateAction<string>>
}

const MainLayoutContext = createContext<MainLayoutContextData | undefined>(undefined)

export default MainLayoutContext
