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