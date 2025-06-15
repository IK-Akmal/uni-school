import type { GetProp, Menu } from "antd";

export interface AsideProps {
  collapsed: boolean;
}

export type MenuClickEventHandler = GetProp<typeof Menu, "onClick">;
