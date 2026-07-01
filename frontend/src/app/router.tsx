import {
  createRouter,
  createRoute,
  createRootRoute,
  Outlet,
  redirect,
} from '@tanstack/react-router'
import { z } from 'zod'
import { LoginPage } from '@features/auth/components/LoginPage'
import { MobileLayout } from '@components/layout/MobileLayout'
import { MatchesPage } from '@features/match/components/MatchesPage'
import { GroupsPage } from '@features/group/components/GroupsPage'
import { GroupDetailPage } from '@features/group/components/GroupDetailPage'
import { LeaderboardPage } from '@features/leaderboard/components/LeaderboardPage'
import { RulesPage } from '@features/rules/components/RulesPage'
import { ProfilePage } from '@features/profile/components/ProfilePage'
import { MatchDetailPage } from '@features/match/components/MatchDetailPage'

const rootRoute = createRootRoute({
  component: Outlet,
})

// / → always redirect to the matches dashboard (AuthGuard handles the login redirect)
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => {
    throw redirect({ to: '/app/matches' })
  },
})

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
})

// /app — authenticated shell; AuthGuard lives inside MobileLayout
const appRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/app',
  component: MobileLayout,
})

const matchesSearchSchema = z.object({
  round: z.string().optional(),
})

const matchesRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/matches',
  validateSearch: matchesSearchSchema,
  component: MatchesPage,
})

const matchDetailRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/matches/$matchId',
  component: MatchDetailPage,
})

const groupsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/groups',
  component: GroupsPage,
})

const groupDetailRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/groups/$groupId',
  component: GroupDetailPage,
})

const leaderboardRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/leaderboard',
  component: LeaderboardPage,
})

const rulesRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/rules',
  component: RulesPage,
})

const profileRoute = createRoute({
  getParentRoute: () => appRoute,
  path: '/profile',
  component: ProfilePage,
})

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  appRoute.addChildren([
    matchesRoute,
    matchDetailRoute,
    groupsRoute,
    groupDetailRoute,
    leaderboardRoute,
    rulesRoute,
    profileRoute,
  ]),
])

export const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
