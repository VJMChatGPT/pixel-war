import type {ComponentProps} from "react";
import {MascotActor} from "./visuals";

export const OctopusMascotActor = (props: ComponentProps<typeof MascotActor>) => {
  return <MascotActor {...props} />;
};

