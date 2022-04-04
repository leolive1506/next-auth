import { GetServerSideProps, GetServerSidePropsContext, GetServerSidePropsResult } from "next"
import { parseCookies } from "nookies"
import { destroyCookieAuth } from "../contexts/AuthContext"
import { AuthTokenError } from "../services/errors/AuthTokenError"
import decode from 'jwt-decode'
import { validateUserPermissions } from "./validateUserPermissions"

type WithSSRAuthOptions = {
    permissions?: string[]
    roles?: string[]
}

// <P>
// tipa o type passado ao chamar a função
// ex: withSSRGuest<{ users: User[]}>
export function withSSRAuth<P>(fn: GetServerSideProps<P>, options?: WithSSRAuthOptions): GetServerSideProps {
    return async(ctx: GetServerSidePropsContext): Promise<GetServerSidePropsResult<P>>  => {
        const cookies = parseCookies(ctx)
        const token = cookies['auth.token']
        
        if (!token) {
            return {
                redirect: {
                    destination: '/',
                    permanent: false
                }
            }
        }

        if (options) {
            const user = decode<{ permissions: string[], roles: string[]}>(token)
            const { permissions, roles } = options
            const userHasValidaPermissions = validateUserPermissions({
                user,
                permissions,
                roles
            })

            if (!userHasValidaPermissions) {
                return {
                    // enviar pra p uma pag que todos user podem acessar ou colocar:
                    // notFound: true,
                    redirect: {
                        destination: '/dashboard',
                        permanent: false
                    }
                }
            }
        }

        try {
            return await fn(ctx)    
        } catch (err) {
            if(err instanceof AuthTokenError) {
                destroyCookieAuth(ctx)
                return {
                    redirect: {
                        destination: '/',
                        permanent: false
                    }
                }
            }
        }
    }
}