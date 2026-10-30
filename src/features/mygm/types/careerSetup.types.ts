export interface BrandOption {
  id: string;
  name: string;
  logo_url: string | null;
  primary_color: string | null;
}

export interface ManagerOption {
  id: string;
  name: string;
  image_url: string | null;
}

export interface DifficultyOption {
  id: string;
  name: string;
}

export interface CareerSetupCatalogs {
  brands: BrandOption[];
  managers: ManagerOption[];
  difficulties: DifficultyOption[];
}
