type User = {
    permissions: string[]
    roles: string[]
}
type ValidateUserPermissions = {
    user: User
    permissions?: string[]
    roles?: string[]
}
export function validateUserPermissions({ user, permissions, roles }: ValidateUserPermissions) {
    if (permissions?.length > 0) {
        // every retorna true caso todas as condições estiverem satisfeitas
        // some retorna true caso pelo menos uma seja verdade
        const hasAllPermissions = permissions.some(permission => {
            return user.permissions.includes(permission)
        })

        if(!hasAllPermissions) {
            return false;
        }
    }

    if (roles?.length > 0) {
        const hasAllRoles = roles.some(role => {
            return user.roles.includes(role)
        })

        if(!hasAllRoles) {
            return false;
        }
    }

    return true;

}