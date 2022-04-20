import Router from "next/router"
import { setCookie, parseCookies, destroyCookie } from "nookies"
import { createContext, ReactNode, useEffect, useState } from "react"
import { api } from "../services/apiClient"

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
    signIn: (credentials: SignCredentials) => Promise<void>
    signOut: () => void
    user: User
    isAuthenticated: boolean
}
export const AuthContext = createContext({} as AuthContextData)
// n pode executar lado cliente
let authChannel: BroadcastChannel

interface AuthProviderProps {
    children: ReactNode
}

export function destroyCookieAuth(ctx = undefined) {
    destroyCookie(ctx, 'auth.token')
    destroyCookie(ctx, 'auth.refreshToken')
}

export function signOut() {
    destroyCookieAuth()

    authChannel.postMessage('signOut')

    Router.push('/')
}

export function setCookieAndRefreshToken(ctx = undefined, token, refreshToken) {
    // contexto_req(nao existe lado browser), nome_cookie, valor
    setCookie(ctx, 'auth.token', token, {
        maxAge: 60 * 60 * 24 * 30,
        path: '/'
    })
    setCookie(ctx, 'auth.refreshToken', refreshToken, {
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
        authChannel = new BroadcastChannel('auth');
      
        authChannel.onmessage = (message) => {
            switch(message.data) {
                case 'signOut':
                    Router.push('/');
                break;
                case 'signIn':
                    document.location.reload()
                break;
            default:
                break;
            }
        };
      }, []);

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
            setCookieAndRefreshToken(undefined, token, refreshToken)
            setUser({
                email,
                permissions,
                roles,
            })

            Router.push('/dashboard')
            authChannel.postMessage('signIn')
        } catch (err) {
            console.log(err)
        }
    }
    return (
        <AuthContext.Provider value={{ signIn, signOut, isAuthenticated, user }}>
            {children}
        </AuthContext.Provider>
    )
}