import { getTranslations, setRequestLocale } from "next-intl/server";
import { SocialProofToast } from "@/components/social-proof-toast";
import { FlashSaleStrip } from "@/components/flash-sale-strip";
import { CmsHomeHero } from "@/components/cms-home-hero";
import { PersonalizedHomeBanner } from "@/components/personalized-home-banner";
import { HomePageContent } from "@/components/home-page-content";
import { FeaturedReviewsStrip } from "@/components/featured-reviews-strip";
import { HomeMobileLandingPills } from "@/components/home-mobile-landing-pills";

type Props = { params: Promise<{ locale: string }> };

export default async function Home({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  await getTranslations("home");

  return (
    <>
      <SocialProofToast />
      <HomeMobileLandingPills />
      <FlashSaleStrip />
      <CmsHomeHero />
      <PersonalizedHomeBanner />
      <FeaturedReviewsStrip />
      <HomePageContent />
    </>
  );
}
