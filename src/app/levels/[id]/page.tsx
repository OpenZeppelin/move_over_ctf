import { redirect } from "next/navigation";
import { LEVEL_IDS } from "@/data/levels";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateStaticParams() {
  return LEVEL_IDS.map((id) => ({ id: String(id) }));
}

export default async function LevelRedirectPage({ params }: Props) {
  const { id } = await params;
  const numericId = Number(id);
  const validId = Number.isInteger(numericId) && LEVEL_IDS.includes(numericId) ? numericId : 0;
  redirect(`/en/levels/${validId}`);
}

