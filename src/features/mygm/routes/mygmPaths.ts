export interface MyGmRoute {
  career_id: string;
  career_slug: string;
  title_id: string | null;
  title_slug: string | null;
}

export function myGmCareerPath(careerSlug: string) {
  return `/mygm/${encodeURIComponent(careerSlug)}`;
}

export function myGmTitlePath(careerPath: string, titleSlug: string) {
  return `${careerPath}/titles/${encodeURIComponent(titleSlug)}`;
}

export function canonicalMyGmPath(pathname: string, route: MyGmRoute) {
  // Keep the original subroute, including encoded identifiers and any trailing slash.
  const segments = pathname.split("/");
  segments[2] = encodeURIComponent(route.career_slug);
  if (route.title_slug !== null) {
    segments[4] = encodeURIComponent(route.title_slug);
  }
  return segments.join("/");
}
