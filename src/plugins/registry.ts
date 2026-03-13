import type { PluginManifest, PluginRegistry } from "./types";

export function createPluginRegistry(seed: PluginManifest[] = []): PluginRegistry {
  const plugins = new Map<string, PluginManifest>();

  seed.forEach((plugin) => {
    plugins.set(plugin.id, plugin);
  });

  return {
    register(plugin) {
      plugins.set(plugin.id, plugin);
    },
    list() {
      return Array.from(plugins.values());
    },
    findByCommand(command) {
      return Array.from(plugins.values()).find((plugin) =>
        plugin.commands.includes(command.toLowerCase())
      );
    }
  };
}
