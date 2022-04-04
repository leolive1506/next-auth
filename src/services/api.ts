import axios, { AxiosError } from 'axios'
import { destroyCookie, parseCookies, setCookie } from 'nookies'
import { setCookieAndRefreshToken, signOut } from '../contexts/AuthContext'
import { AuthTokenError } from './errors/AuthTokenError'


let isRefreshing = false
let failedRequestQueue = []

export function setupApiClient(ctx = undefined) {
    let cookies = parseCookies(ctx)

     const api = axios.create(({
        baseURL: 'http://localhost:3333',
        headers: {
            Authorization: `Bearer ${cookies['auth.token']}`
        }
    }))

    api.interceptors.response.use(response => {
        // se der certo faz nada
        return response
    }, (error: AxiosError) => {
        // se der errado
        if(error.response.status === 401) {
            if(error.response.data?.code === 'token.expired') {
                // atualizando os cookies
                cookies = parseCookies(ctx)
                const { 'auth.refreshToken': refreshToken } = cookies
                // toda config da req feita (rota, params, callback)
                const originalConfig = error.config
    
                if(!isRefreshing) {
                    isRefreshing = true
    
                    api.post('/refresh', {
                        refreshToken
                    }).then(response => {
                        const { token, refreshToken: newRefreshToken } = response.data
                        setCookieAndRefreshToken(ctx, token, newRefreshToken)
                         
                        // executanto as reqs
                        failedRequestQueue.forEach(req => req.onSuccess(token))
                        failedRequestQueue = []
                    }).catch(err => {
                        failedRequestQueue.forEach(req => req.onFaily(err))
                        failedRequestQueue = []
                        // indicar se ta sendo executado browser ou next
                        if(typeof window !== 'undefined') {
                            signOut()
                        }
                    }).finally(() => {
                        isRefreshing = false
                    })
                }
    
                // criar uma fila com as req se tiver expired
                // apos atualizar token, executa as req com o token atualizado
                return new Promise((resolve, reject) => {
                    failedRequestQueue.push({
                        // oq acontece quando finalizar refresh
                        onSuccess: (token: string) => {
                            // retentar a requisição
                            originalConfig.headers['Authorization'] = `Bearer ${token}`
                            resolve(api(originalConfig))
                        },
                        // oq acontece se der errado
                        onFaily: (err: AxiosError) => {
                            reject(err)
                        }
                    })
                })
            } else {
                // deslogar user
                if(typeof window !== 'undefined') {
                    signOut()
                } else {
                    return Promise.reject(new AuthTokenError())
                }
            }
        }
    
        return Promise.reject(error)
    })

    return api
}

