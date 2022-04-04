# Pode armazenar user logado em 
- sessionStorage
    - So quando fechar navegador limpa
- localStorage
    - guarda os dados porém não é acessível lado servidor next
- cookies (usado)
    - acessado browser e server next
    - Forma nativa de acessar (não mt amigável)
    ```ts
    document.cookie
    ```
    - Usado no curso nookies
    ```sh
    yarn add nookies
    ```

    - Usar
        - Cliente
        ```ts
        import { setCookie } from "nookies"
        try {
            const response = await api.post('sessions', {
                email, password
            })
            const { token, refreshToken, permissions, roles } = response.data
            // contexto_req(nao existe lado browser), nome_cookie, valor
            setCookie(undefined, 'auth.token', token, {
                // tempo salvo no navegador
                maxAge: 60 * 60 * 24 * 30, // 30 dias
                path: '/' // caminhos app qu vão ter acesso (/ -> qualquer rota tem acesso)
            })
            setCookie(undefined, 'auth.refreshToken', refreshToken, {
                maxAge: 60 * 60 * 24 * 30, // 30 dias
                path: '/'
            })
            setUser({
                email,
                permissions,
                roles,
            })

            Router.push('/dashboard')
        } catch (err) {
            console.log(err)
        }
        ```
    - Servidor
    ```ts
    const cookies = parseCookies(ctx)
    if (cookies['auth.token']) {
        return {
        redirect: {
            destination: '/dashboard',
            permanent: false
        }
        }
    }
    ```

# Criar um interceptador p refresh token no axios
```ts
import axios, { AxiosError } from 'axios'
import { parseCookies, setCookie } from 'nookies'

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
        }
    }
})
```

# JWT DECODE
- Decodificar um token
```sh
yarn add jwt-decode
```