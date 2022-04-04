import { useContext, useEffect } from "react"
import { AuthContext } from "../contexts/AuthContext"
import { useCan } from "../hooks/useCan"
import { setupApiClient } from "../services/api"
import { api } from "../services/apiClient"

import { withSSRAuth } from "../utils/withSSRAuth"

export default function Dashboard() {
    const { user } = useContext(AuthContext)

    const userCanSeeMetrics = useCan({
        roles: ['administrator', 'editor']
    })
    useEffect(() => {    
        api.get('/me')
        .then(res => console.log(res.data))
        .catch(err => console.log(err))
    }, [])

    return (
        <>
            <h1>Dashboard: {user?.email}</h1>

            { userCanSeeMetrics && (
                <div>Métricas</div>
            )}
        </>
    )
}

export const getServerSideProps = withSSRAuth(async(ctx) => {
    const apiClient = setupApiClient(ctx)
    const response = await apiClient.get('/me')
    console.log(response.data)
    
    return {
        props: {}
    }
})