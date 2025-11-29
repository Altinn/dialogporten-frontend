export interface AlertBannerLink {
  url: string;
  text: string;
}

export interface AlertBannerContent {
  title: string;
  description: string;
  link?: AlertBannerLink;
}

export interface AlertBannerResponse {
  nb?: AlertBannerContent;
  nn?: AlertBannerContent;
  en?: AlertBannerContent;
}
