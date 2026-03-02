import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function LevelsIndexPage({ params }: Props) {
  const { locale } = await params;
  redirect(`/${locale}/levels/how-to-play`);
}
