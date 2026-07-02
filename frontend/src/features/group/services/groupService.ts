import { supabase } from '@/lib/supabaseClient'
import type { Group, GroupMember, Profile } from '@/types/domain.types'

const INVITE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function generateInviteCode(): string {
  return Array.from(
    { length: 8 },
    () => INVITE_CHARS[Math.floor(Math.random() * INVITE_CHARS.length)]
  ).join('')
}

export type GroupWithMemberCount = Group & { member_count: number }
export type GroupMemberWithProfile = GroupMember & { profile: Profile }

export const groupService = {
  async createGroup(name: string, competitionId: string): Promise<GroupWithMemberCount> {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // Retry on invite_code unique constraint violation (astronomically rare)
    for (let attempt = 0; attempt < 5; attempt++) {
      const inviteCode = generateInviteCode()
      const { data, error } = await supabase
        .from('groups')
        .insert({ name, competition_id: competitionId, owner_id: user.id, invite_code: inviteCode })
        .select()
        .single()

      if (error?.code === '23505') continue
      if (error) throw error

      // Auto-add creator as member
      const { error: joinErr } = await supabase
        .from('group_members')
        .insert({ group_id: data.id, user_id: user.id })
      if (joinErr) throw joinErr

      return { ...data, member_count: 1 }
    }
    throw new Error('Failed to generate a unique invite code — please try again')
  },

  async joinGroupByCode(inviteCode: string): Promise<Group> {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data: group, error: findErr } = await supabase
      .from('groups')
      .select('*')
      .eq('invite_code', inviteCode.toUpperCase().trim())
      .single()

    if (findErr) throw new Error('Invalid invite code — group not found')

    const { error } = await supabase
      .from('group_members')
      .insert({ group_id: group.id, user_id: user.id })

    if (error?.code === '23505') throw new Error('You are already a member of this group')
    if (error) throw error

    return group
  },

  async getMyGroups(): Promise<GroupWithMemberCount[]> {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return []

    // Step 1: groups I'm in
    const { data: memberships, error: memErr } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', user.id)

    if (memErr) throw memErr
    if (!memberships.length) return []

    const groupIds = memberships.map((m) => m.group_id)

    // Step 2: group details + all member counts in parallel
    const [groupsResult, countsResult] = await Promise.all([
      supabase.from('groups').select('*').in('id', groupIds),
      supabase.from('group_members').select('group_id').in('group_id', groupIds),
    ])

    if (groupsResult.error) throw groupsResult.error

    const countMap = new Map<string, number>()
    countsResult.data?.forEach((m) => {
      countMap.set(m.group_id, (countMap.get(m.group_id) ?? 0) + 1)
    })

    return groupsResult.data.map((g) => ({
      ...g,
      member_count: countMap.get(g.id) ?? 0,
    }))
  },

  async getGroupMembers(groupId: string): Promise<GroupMemberWithProfile[]> {
    const { data: members, error: memErr } = await supabase
      .from('group_members')
      .select('*')
      .eq('group_id', groupId)

    if (memErr) throw memErr
    if (!members.length) return []

    const userIds = members.map((m) => m.user_id)
    const { data: profiles, error: profErr } = await supabase
      .from('profiles')
      .select('*')
      .in('id', userIds)

    if (profErr) throw profErr

    const profileMap = new Map(profiles.map((p) => [p.id, p]))

    return members.map((m) => ({
      ...m,
      profile: profileMap.get(m.user_id) ?? {
        id: m.user_id,
        display_name: 'Unknown',
        avatar_url: null,
        created_at: '',
        updated_at: '',
      },
    }))
  },

  async leaveGroup(groupId: string): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { error } = await supabase
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', user.id)

    if (error) throw error
  },

  async updateGroupStakes(groupId: string, stakes: string): Promise<void> {
    const { error } = await supabase
      .from('groups')
      .update({ stakes: stakes.trim() || null, updated_at: new Date().toISOString() })
      .eq('id', groupId)

    if (error) throw error
  },
}
