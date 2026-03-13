import { isTauri } from "@tauri-apps/api/core";
import { DesktopShell } from "./components/DesktopShell";
import { LandingPage } from "./components/LandingPage";

const embeddedInTauri = isTauri();

export default function App() {
  return embeddedInTauri ? <DesktopShell /> : <LandingPage />;
}
