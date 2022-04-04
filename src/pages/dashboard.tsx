import { useContext, useEffect } from "react"
import { AuthContext, destroyCookieAuth } from "../contexts/AuthContext"
import { setupApiClient } from "../services/api"
import { api } from "../services/apiClient"
import { AuthTokenError } from "../services/errors/AuthTokenError"

import { withSSRAuth } from "../utils/withSSRAuth"

export default function Dashboard() {
    const { user } = useContext(AuthContext)
    useEffect(() => {    
        api.get('/me')
        .then(res => console.log(res.data))
        .catch(err => console.log(err))
    }, [])

    return (
        <h1>Dashboard: {user?.email}</h1>
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