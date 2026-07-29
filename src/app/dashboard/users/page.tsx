import { createClient } from '@/utils/supabase/server'
import UserManagementForm from './UserManagementForm'
import DeleteButton from './DeleteButton'
import EditUserModal from './EditUserModal'
import BulkUserUpload from './BulkUserUpload'
import styles from './users.module.css'
import { deleteUser, toggleBlockUser } from './actions'

export default async function UsersPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: userProfile } = await supabase
    .from('users')
    .select('roles')
    .eq('id', user.id)
    .single()

  if (!userProfile?.roles?.includes('Admin')) {
    return <div className={styles.container}><div className={styles.card}><h2>Unauthorized</h2></div></div>
  }

  // Use Admin Client to bypass RLS for fetching user list securely on the server
  const { createAdminClient } = await import('@/utils/supabase/admin')
  const adminClient = createAdminClient()

  // Fetch all custom users
  const { data: dbUsers } = await adminClient
    .from('users')
    .select('id, email, roles, created_at')
    .order('created_at', { ascending: false })

  // Fetch all auth users to check ban status
  const { data: authData } = await adminClient.auth.admin.listUsers()
  
  // Merge status
  const users = dbUsers?.map(dbUser => {
    const authUser = authData?.users?.find(u => u.id === dbUser.id)
    const isBlocked = authUser?.banned_until != null
    return {
      ...dbUser,
      isBlocked
    }
  })

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2>Create New User</h2>
        <p className={styles.subtitle}>
          Creates a login account and assigns a role. A random password will be generated for them.
        </p>
        <UserManagementForm />
        <BulkUserUpload />
      </div>

      <div className={styles.card}>
        <h2>Manage Existing Users</h2>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users?.map((user: any) => (
                <tr key={user.id}>
                  <td className={styles.email}>{user.email}</td>
                  <td>
                    {user.roles && user.roles.map((r: string) => (
                      <span key={r} className={`${styles.roleBadge} ${styles[r.toLowerCase()]}`} style={{ marginRight: '0.5rem' }}>
                        {r}
                      </span>
                    ))}
                  </td>
                  <td>
                    {user.isBlocked ? (
                      <span style={{ color: '#ef4444', fontWeight: 600, fontSize: '0.875rem' }}>Blocked</span>
                    ) : (
                      <span style={{ color: '#10b981', fontWeight: 600, fontSize: '0.875rem' }}>Active</span>
                    )}
                  </td>
                  <td className={styles.date}>
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <EditUserModal user={user} />
                      <form action={toggleBlockUser}>
                        <input type="hidden" name="user_id" value={user.id} />
                        <input type="hidden" name="current_status" value={user.isBlocked ? 'blocked' : 'active'} />
                        <button type="submit" style={{ padding: '0.375rem 0.75rem', backgroundColor: user.isBlocked ? '#10b981' : '#f59e0b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.875rem' }}>
                          {user.isBlocked ? 'Unblock' : 'Block'}
                        </button>
                      </form>
                      <form action={deleteUser}>
                        <input type="hidden" name="user_id" value={user.id} />
                        <DeleteButton email={user.email} />
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
