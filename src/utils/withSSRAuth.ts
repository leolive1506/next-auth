import { GetServerSideProps, GetServerSidePropsContext, GetServerSidePropsResult } from "next"
import { parseCookies } from "nookies"

// <P>
// tipa o type passado ao chamar a função
// ex: withSSRGuest<{ users: User[]}>
export function withSSRAuth<P>(fn: GetServerSideProps<P>): GetServerSideProps {
    return async(ctx: GetServerSidePropsContext): Promise<GetServerSidePropsResult<P>>  => {
        const cookies = parseCookies(ctx)
        if (!cookies['auth.token']) {
            return {
                redirect: {
                    destination: '/',
                    permanent: false
                }
            }
        }

        return await fn(ctx)
    }
}