import { LocaleProvider } from "@/components/LocaleProvider";
import { RecommendScreen } from "@/components/RecommendScreen";

export default function Home() {
  return (
    <LocaleProvider>
      <RecommendScreen />
    </LocaleProvider>
  );
}
