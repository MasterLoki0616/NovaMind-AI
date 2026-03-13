export interface PluginManifest {
  id: string;
  name: string;
  description: string;
  commands: string[];
  enabledByDefault?: boolean;
}

export interface PluginRegistry {
  register: (plugin: PluginManifest) => void;
  list: () => PluginManifest[];
  findByCommand: (command: string) => PluginManifest | undefined;
}
