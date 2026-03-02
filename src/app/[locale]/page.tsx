import { Header } from "@/components/Header";
import { Landing } from "@/components/Landing";

export default function LocaleHome() {
  return (
    <div className="h-screen flex flex-col">
      <Header />
      <Landing />
    </div>
  );
}
