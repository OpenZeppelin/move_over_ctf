import { permanentRedirect } from "next/navigation";
import { LEVEL_IDS } from "@/data/levels";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateStaticParams() {
  return LEVEL_IDS.map((id) => ({ id }));
}

export default async function LevelRedirectPage({ params }: Props) {
  const { id } = await params;
  const validId = LEVEL_IDS.includes(id) ? id : LEVEL_IDS[0];
  permanentRedirect(`/en/levels/${validId}`);
}
