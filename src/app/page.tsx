import Dashboard from "@/components/Dashboard";
import statsData from "../../public/stats.json";
import { ClawPulseStats } from "@/types/stats";

export default function Home() {
  return <Dashboard stats={statsData as ClawPulseStats} />;
}
