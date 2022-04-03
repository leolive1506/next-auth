import axios, { AxiosError } from 'axios'
import { destroyCookie, parseCookies, setCookie } from 'nookies'
import { signOut } from '../contexts/AuthContext'

let cookies = parseCookies()
let isRefreshing = false
let failedRequestQueue = []

export const api = axios.create(({
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
            cookies = parseCookies()
            const { 'auth.refreshToken': refreshToken } = cookies
            // toda config da req feita (rota, params, callback)
            const originalConfig = error.config

            if(!isRefreshing) {
                isRefreshing = true 

                api.post('/refresh', {
                    refreshToken
                }).then(response => {
                    const { token } = response.data
                    setCookie(undefined, 'auth.token', token, {
                        maxAge: 60 * 60 * 24 * 30,
                        path: '/'
                    })
                    setCookie(undefined, 'auth.refreshToken', response.data.refreshToken, {
                        maxAge: 60 * 60 * 24 * 30,
                        path: '/'
                    })
                    api.defaults.headers['Authorization'] = `Bearer ${token}`
                     
                    // executanto as reqs
                    failedRequestQueue.forEach(req => req.onSuccess(token))
                    failedRequestQueue = []
                }).catch(err => {
                    failedRequestQueue.forEach(req => req.onFaily(err))
                    failedRequestQueue = []
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
                onFaily: (error: AxiosError) => {
                    reject(error)
                }
            })
        })

        } else {
            // deslogar user
            signOut()
        }
    }

    return Promise.reject(error)
})