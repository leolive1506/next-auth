import { setupApiClient } from "../services/api"
import { withSSRAuth } from "../utils/withSSRAuth"


export default function Dashboard() {
    return (
        <>
            <div>Métricas</div>  
        </>
    )
}

export const getServerSideProps = withSSRAuth(async(ctx) => {
    const apiClient = setupApiClient(ctx)
    const response = await apiClient.get('/me')
    
    return {
        props: {}
    }
}, {
    permissions: ['metrics.list'],
    roles: ['administrator'],
})