import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, x-client-info, content-type, x-supabase-api-version',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
}

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function respond(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders })
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders })
  }
  if (request.method !== 'POST') return respond({ error: 'Method not allowed.' }, 405)

  try {
    const authorization = request.headers.get('Authorization')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!authorization || !supabaseUrl || !anonKey || !serviceRoleKey) {
      return respond({ error: 'Supabase authentication is not configured for this function.' }, 500)
    }

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authorization } },
      auth: { autoRefreshToken: false, persistSession: false },
    })
    const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    const { data: callerData, error: callerError } = await callerClient.auth.getUser()
    if (callerError || !callerData.user) return respond({ error: 'Sign in to continue.' }, 401)

    const caller = callerData.user
    const { data: callerProfile, error: profileError } = await serviceClient
      .from('profiles')
      .select('role')
      .eq('id', caller.id)
      .maybeSingle()
    if (profileError) throw profileError

    const body = await request.json()
    const action = body?.action

    if (action === 'change-password') {
      if (caller.app_metadata?.role !== 'teacher' || caller.app_metadata?.force_password_change !== true) {
        return respond({ error: 'This account does not require a temporary password change.' }, 403)
      }
      const newPassword = String(body?.newPassword || '')
      if (newPassword.length < 12) {
        return respond({ error: 'Choose a password with at least 12 characters.' }, 400)
      }

      const { error } = await serviceClient.auth.admin.updateUserById(caller.id, {
        password: newPassword,
        app_metadata: { ...caller.app_metadata, force_password_change: false },
      })
      if (error) throw error
      return respond({ success: true })
    }

    const isAdmin = callerProfile?.role === 'admin'
    if (!isAdmin) return respond({ error: 'Administrator access is required.' }, 403)

    if (action === 'list') {
      const { data: profiles, error: teachersError } = await serviceClient
        .from('profiles')
        .select('id, email, full_name, teacher_id, role')
        .eq('role', 'teacher')
        .order('full_name', { ascending: true })
      if (teachersError) throw teachersError

      const teachers = await Promise.all((profiles || []).map(async (profile) => {
        const { data, error } = await serviceClient.auth.admin.getUserById(profile.id)
        if (error?.code === 'user_not_found') {
          return { ...profile, accessEnabled: false }
        }
        if (error) throw error
        const authUser = data.user
        return {
          ...profile,
          accessEnabled: !authUser.banned_until &&
            authUser.app_metadata?.teacher_access_enabled !== false,
        }
      }))
      return respond({ teachers })
    }

    if (action === 'create') {
      const fullName = String(body?.full_name || body?.fullName || '').trim()
      const teacherId = String(body?.teacher_id || body?.teacherId || '').trim()
      const email = String(body?.email || '').trim().toLowerCase()
      const temporaryPassword = String(body?.password || body?.temporaryPassword || '')
      const courseIds = [...new Set(
        Array.isArray(body?.course_ids)
          ? body.course_ids.map((id: unknown) => String(id))
          : Array.isArray(body?.courseIds)
            ? body.courseIds.map((id: unknown) => String(id))
            : [],
      )]

      if (fullName.length < 2 || fullName.length > 120) {
        return respond({ error: 'Enter a teacher name between 2 and 120 characters.' }, 400)
      }
      if (!teacherId || teacherId.length > 80) {
        return respond({ error: 'Enter a valid teacher ID.' }, 400)
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return respond({ error: 'Enter a valid teacher email address.' }, 400)
      }
      if (temporaryPassword.length < 12) {
        return respond({ error: 'Temporary passwords must contain at least 12 characters.' }, 400)
      }
      if (!courseIds.length || courseIds.some((id) => !uuidPattern.test(id))) {
        return respond({ error: 'Assign at least one valid course to the teacher.' }, 400)
      }

      const { data: duplicateTeacherId, error: duplicateError } = await serviceClient
        .from('profiles')
        .select('id')
        .eq('teacher_id', teacherId)
        .maybeSingle()
      if (duplicateError) throw duplicateError
      if (duplicateTeacherId) return respond({ error: 'That teacher ID is already in use.' }, 409)

      const { data: courseRows, error: coursesError } = await serviceClient
        .from('courses')
        .select('id')
        .in('id', courseIds)
      if (coursesError) throw coursesError
      if ((courseRows || []).length !== courseIds.length) {
        return respond({ error: 'One or more selected subjects no longer exist. Refresh and try again.' }, 400)
      }

      const { data: created, error: createError } = await serviceClient.auth.admin.createUser({
        email,
        password: temporaryPassword,
        email_confirm: true,
        app_metadata: {
          role: 'teacher',
          force_password_change: true,
          teacher_access_enabled: true,
        },
        user_metadata: { full_name: fullName },
      })
      if (createError) throw createError
      if (!created.user) throw new Error('Supabase Auth did not return the created teacher account.')

      const profileValues = {
        id: created.user.id,
        email,
        full_name: fullName,
        teacher_id: teacherId,
        role: 'teacher',
      }
      const { error: insertProfileError } = await serviceClient
        .from('profiles')
        .upsert(profileValues, { onConflict: 'id' })
      if (insertProfileError) {
        const { error: rollbackError } = await serviceClient.auth.admin.deleteUser(created.user.id)
        if (rollbackError) {
          throw new Error(`Could not create the teacher profile (${insertProfileError.message}); account cleanup failed (${rollbackError.message}).`)
        }
        throw insertProfileError
      }

      const assignments = courseIds.map((courseId) => ({
        id: crypto.randomUUID(),
        teacher_id: created.user!.id,
        course_id: courseId,
      }))
      const { error: assignmentsError } = await serviceClient
        .from('teacher_subjects')
        .insert(assignments)
      if (assignmentsError) {
        const { error: profileRollbackError } = await serviceClient
          .from('profiles')
          .delete()
          .eq('id', created.user.id)
        const { error: authRollbackError } = await serviceClient.auth.admin.deleteUser(created.user.id)
        if (profileRollbackError || authRollbackError) {
          throw new Error(`Could not assign the teacher's subjects (${assignmentsError.message}); cleanup failed${profileRollbackError ? ` for profile (${profileRollbackError.message})` : ''}${authRollbackError ? ` for Auth account (${authRollbackError.message})` : ''}.`)
        }
        throw assignmentsError
      }

      return respond({ teacher: { ...profileValues, accessEnabled: true }, assignments })
    }

    if (action === 'disable') {
      const teacherId = String(body?.teacherId || '')
      if (!uuidPattern.test(teacherId)) return respond({ error: 'A valid teacher account ID is required.' }, 400)
      if (teacherId === caller.id) return respond({ error: 'You cannot disable your own administrator account.' }, 400)

      const { data: teacher, error: teacherError } = await serviceClient
        .from('profiles')
        .select('id, role')
        .eq('id', teacherId)
        .maybeSingle()
      if (teacherError) throw teacherError
      if (!teacher || teacher.role !== 'teacher') {
        return respond({ error: 'Teacher account was not found.' }, 404)
      }

      const { data: authData, error: authError } = await serviceClient.auth.admin.getUserById(teacherId)
      if (authError) throw authError
      const { error: disableError } = await serviceClient.auth.admin.updateUserById(teacherId, {
        ban_duration: '876000h',
        app_metadata: {
          ...authData.user.app_metadata,
          teacher_access_enabled: false,
        },
      })
      if (disableError) throw disableError

      const { error: removeAssignmentsError } = await serviceClient
        .from('teacher_subjects')
        .delete()
        .eq('teacher_id', teacherId)
      if (removeAssignmentsError) {
        throw new Error(`Teacher login was disabled, but subject assignments could not be removed: ${removeAssignmentsError.message}`)
      }

      return respond({ success: true, teacherId, accessEnabled: false })
    }

    return respond({ error: 'Unsupported teacher account action.' }, 400)
  } catch (error) {
    console.error('Teacher account administration failed:', error)
    return respond({ error: error instanceof Error ? error.message : 'Teacher account operation failed.' }, 500)
  }
})
