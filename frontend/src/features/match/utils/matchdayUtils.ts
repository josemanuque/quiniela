export const GROUP_MATCHDAY_PREFIX = 'group_md_'
export type GroupMatchdayId = 'group_md_1' | 'group_md_2' | 'group_md_3'

export function isGroupMatchdayId(id: string): id is GroupMatchdayId {
  return id.startsWith(GROUP_MATCHDAY_PREFIX)
}

export function matchdayFromId(id: GroupMatchdayId): 1 | 2 | 3 {
  return parseInt(id.slice(GROUP_MATCHDAY_PREFIX.length), 10) as 1 | 2 | 3
}
