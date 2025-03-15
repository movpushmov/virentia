import { createElement, type FC } from "react";
import type { CachedComponentConfig, ComponentConfig } from "./types";
import { useModel } from "./use-model";
import { getComponentName } from "./utils";

export function component<Props, Model extends object>(
  config: ComponentConfig<Props, Model>,
): FC<Props>;
export function component<Props, Key, Model extends object>(
  config: CachedComponentConfig<Props, Key, Model>,
): FC<Props>;
export function component(
  config: ComponentConfig<any, any> | CachedComponentConfig<any, any, any>,
): FC<any> {
  const VirentiaComponent: FC<any> = (props) => {
    const model =
      "cache" in config
        ? useModel(config.model, props, {
            cache: config.cache,
            key: config.key(props),
          })
        : useModel(config.model, props);

    return createElement(config.view, { ...props, model });
  };

  VirentiaComponent.displayName = getComponentName(config.view);

  return VirentiaComponent;
}
