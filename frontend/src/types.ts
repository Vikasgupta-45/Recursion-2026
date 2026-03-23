export type Platform = "YouTube" | "Instagram";

export interface SocialLink {
  id: string;
  platform: Platform;
  url: string;
}

export interface UserProfile {
  name: string;
  age: string;
  email: string;
  phone: string;
  links: SocialLink[];
}

export interface User {
  fullName: string;
  email: string;
}
