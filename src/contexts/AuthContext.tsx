import Router from "next/router"
import { setCookie, parseCookies, destroyCookie } from "nookies"
import { createContext, ReactNode, useEffect, useState } from "react"
import { api } from "../services/api"

type User = {
    email: string
    permissions: string[]
    roles: string[]
}

type SignCredentials = {
    email: string
    password: string
}
type AuthContextData = {
    signIn(credentials: SignCredentials): Promise<void>
    user: User
    isAuthenticated: boolean
}
export const AuthContext = createContext({} as AuthContextData)

interface AuthProviderProps {
    children: ReactNode
}

export function signOut() {
    destroyCookie(undefined, 'auth.token')
    destroyCookie(undefined, 'auth.refreshToken')
    Router.push('/')
}

export function setCookieAndRefreshToken(token, refreshToken) {
    // contexto_req(nao existe lado browser), nome_cookie, valor
    setCookie(undefined, 'auth.token', token, {
        maxAge: 60 * 60 * 24 * 30,
        path: '/'
    })
    setCookie(undefined, 'auth.refreshToken', refreshToken, {
        maxAge: 60 * 60 * 24 * 30,
        path: '/'
    })
    // atualizar headers
    api.defaults.headers['Authorization'] = `Bearer ${token}`
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User>()
    const isAuthenticated = !!user

    useEffect(() => {
        // pegando todos cookies
        const { 'auth.token': token } = parseCookies()
        if(token) {
            api.get('/me').then(res => {
                const { email, permissions, roles } = res.data

                setUser({ email, permissions, roles })
            })
            // cai aqui quando não for erro de refresh token, se for refresh token o axios intercepta
            .catch(() => {
                signOut()
            })
        }
    }, [])
    async function signIn({email, password}: SignCredentials) {
        try {
            const response = await api.post('sessions', {
                email, password
            })
            const { token, refreshToken, permissions, roles } = response.data
            setCookieAndRefreshToken(token, refreshToken)
            setUser({
                email,
                permissions,
                roles,
            })

            Router.push('/dashboard')
        } catch (err) {
            console.log(err)
        }
    }
    return (
        <AuthContext.Provider value={{ signIn, isAuthenticated, user }}>
            {children}
        </AuthContext.Provider>
    )
}