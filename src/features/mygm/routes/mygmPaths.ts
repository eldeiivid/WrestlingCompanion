export interface MyGmRoute {
  career_id: string;
  career_slug: string;
  title_id: string | null;
  title_slug: string | null;
}

export interface MyGmWrestlerRoute {
  career_id: string;
  career_slug: string;
  wrestler_id: string;
  wrestler_slug: string;
}

export type ResolvedMyGmRoute = MyGmRoute | MyGmWrestlerRoute;

export function myGmCareerPath(careerSlug: string) {
  return `/mygm/${encodeURIComponent(careerSlug)}`;
}

export function myGmTitlePath(careerPath: string, titleSlug: string) {
  return `${careerPath}/titles/${encodeURIComponent(titleSlug)}`;
}

export function myGmWrestlerPath(careerPath: string, wrestlerRef: string) {
  return `${careerPath}/roster/${encodeURIComponent(wrestlerRef)}`;
}

export function canonicalMyGmPath(pathname: string, route: ResolvedMyGmRoute) {
  if ("wrestler_slug" in route) {
    return myGmWrestlerPath(myGmCareerPath(route.career_slug), route.wrestler_slug);
  }

  // Keep the original subroute, including encoded identifiers and any trailing slash.
  const segments = pathname.split("/");
  segments[2] = encodeURIComponent(route.career_slug);
  if (route.title_slug !== null) {
    segments[4] = encodeURIComponent(route.title_slug);
  }
  return segments.join("/");
}
