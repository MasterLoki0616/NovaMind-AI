import { isTauri } from "@tauri-apps/api/core";
import { useEffect } from "react";
import { DesktopShell } from "./components/DesktopShell";
import { LandingPage } from "./components/LandingPage";

const embeddedInTauri = isTauri();

export default function App() {
  useEffect(() => {
    function disableContextMenu(event: MouseEvent) {
      event.preventDefault();
    }

    window.addEventListener("contextmenu", disableContextMenu);
    return () => window.removeEventListener("contextmenu", disableContextMenu);
  }, []);

  return embeddedInTauri ? <DesktopShell /> : <LandingPage />;
}
