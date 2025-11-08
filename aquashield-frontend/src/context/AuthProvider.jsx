import React, { createContext, useContext } from 'react'

const AuthContext = createContext(null)

// Optional helper hook (use where needed)
export function useAuth() {
  return useContext(AuthContext)
}

// Named export
export function AuthProvider({ children }) {
  const value = null // put real auth state here if you have it
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Default export (so both `AuthProvider` and `{ AuthProvider }` imports work)
export default AuthProvider