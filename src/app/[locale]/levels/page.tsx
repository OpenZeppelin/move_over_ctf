import { permanentRedirect } from "next/navigation";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function LevelsIndexPage({ params }: Props) {
  const { locale } = await params;
  permanentRedirect(`/${locale}/levels/how-to-play`);
}
