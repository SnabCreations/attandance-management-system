import { createClient } from '@/utils/supabase/server'
import UserManagementForm from './UserManagementForm'
import DeleteButton from './DeleteButton'
import EditUserModal from './EditUserModal'
import BulkUserUpload from './BulkUserUpload'
import ResetPasswordButton from './ResetPasswordButton'
import styles from './users.module.css'
import { deleteUser, toggleBlockUser, resetUserPassword } from './actions'

import Pagination from '../components/Pagination'

export default async function UsersPage(props: { searchParams: Promise<{ query?: string; role?: string; semester?: string; page?: string }> }) {
  const searchParams = await props.searchParams;
  const { query, role, semester, page: pageStr } = searchParams;
  const page = parseInt(pageStr || '1')
  const pageSize = 15
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
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

  // Fetch all custom users with filters
  let userQuery = adminClient
    .from('users')
    .select('id, email, roles, created_at, avatar_url')
    
  let filterUserIds: string[] | null = null;
  if (semester) {
    const semId = parseInt(semester)
    const { data: students } = await adminClient.from('students').select('user_id, parent_id').eq('semester_id', semId)
    const { data: tutors } = await adminClient.from('semester_tutors').select('tutor_id').eq('semester_id', semId)
    const { data: facSubs } = await adminClient.from('faculty_subjects').select('faculty_id').eq('semester_id', semId)

    const validIds = new Set<string>()
    students?.forEach(s => {
      if (s.user_id) validIds.add(s.user_id)
      if (s.parent_id) validIds.add(s.parent_id)
    })
    tutors?.forEach(t => t.tutor_id && validIds.add(t.tutor_id))
    facSubs?.forEach(f => f.faculty_id && validIds.add(f.faculty_id))
    
    filterUserIds = Array.from(validIds)
    if (filterUserIds.length === 0) {
      filterUserIds = ['00000000-0000-0000-0000-000000000000']
    }
  }

  if (query) {
    userQuery = userQuery.ilike('email', `%${query}%`)
  }
  if (role) {
    userQuery = userQuery.contains('roles', [role])
  }
  if (filterUserIds) {
    userQuery = userQuery.in('id', filterUserIds)
  }

  // Get count
  let countQuery = adminClient.from('users').select('*', { count: 'exact', head: true })
  if (query) countQuery = countQuery.ilike('email', `%${query}%`)
  if (role) countQuery = countQuery.contains('roles', [role])
  if (filterUserIds) countQuery = countQuery.in('id', filterUserIds)
  
  const { count: totalUsers } = await countQuery
  const totalPages = Math.ceil((totalUsers || 0) / pageSize)

  const { data: dbUsers } = await userQuery
    .order('created_at', { ascending: false })
    .range(from, to)

  const basePath = `?query=${query || ''}&role=${role || ''}&semester=${semester || ''}`

  // Fetch all semesters for the dropdown
  const { data: allSemesters } = await adminClient
    .from('semesters')
    .select('id, name, departments(name)')
    .order('department_id')

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
        
        <form className={styles.filtersForm} style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <input type="text" name="query" placeholder="Search by email..." defaultValue={query || ''} className={styles.searchInput} style={{ padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '4px', flex: 1, minWidth: '200px' }} />
          
          <select name="role" defaultValue={role || ''} className={styles.filterSelect} style={{ padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '4px', minWidth: '150px' }}>
            <option value="">All Roles</option>
            <option value="Admin">Admin</option>
            <option value="Faculty">Faculty</option>
            <option value="Tutor">Tutor</option>
            <option value="Parent">Parent</option>
            <option value="Student">Student</option>
          </select>
          
          <select name="semester" defaultValue={semester || ''} className={styles.filterSelect} style={{ padding: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '4px', minWidth: '150px' }}>
            <option value="">All Semesters</option>
            {allSemesters?.map((sem: any) => (
              <option key={sem.id} value={sem.id}>
                {sem.departments?.name} - {sem.name}
              </option>
            ))}
          </select>
          
          <button type="submit" className={styles.filterBtn} style={{ padding: '0.5rem 1rem', backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Filter</button>
        </form>
        
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
                  <td className={styles.email}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt="Avatar" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                           <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        </div>
                      )}
                      <span>{user.email}</span>
                    </div>
                  </td>
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
                      <ResetPasswordButton userId={user.id} email={user.email} />
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
        <Pagination totalPages={totalPages} currentPage={page} basePath={basePath} />
      </div>
    </div>
  )
}
