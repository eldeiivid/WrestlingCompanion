import { useOutletContext } from "react-router-dom";
import type { MyGmOutletContext } from "../types/mygm.types";

export function useMyGmCareerPath() {
  return useOutletContext<MyGmOutletContext>().careerPath;
}
