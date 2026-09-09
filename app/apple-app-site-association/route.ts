const TEAM_ID = '4G78R8MHBD'
const BUNDLE_ID = 'com.rootlink.app'

export const dynamic = 'force-static'

export function GET(): Response {
  const body = JSON.stringify({
    applinks: {
      apps: [],
      details: [
        {
          appID: `${TEAM_ID}.${BUNDLE_ID}`,
          paths: ['*'],
        },
      ],
    },
  })
  return new Response(body, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
