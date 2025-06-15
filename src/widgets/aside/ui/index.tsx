import { FC } from "react";
import { Layout, Menu } from "antd";
import { useLocation, useNavigate } from "react-router";

import { Logo } from "@/shared/components/logo";

import { menuItems } from "./Aside.constants";
import type { AsideProps, MenuClickEventHandler } from "./Aside.types";

export const Aside: FC<AsideProps> = ({ collapsed }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const onClick: MenuClickEventHandler = (item) => {
    navigate(item.key);
  };

  return (
    <Layout.Sider collapsible collapsed={collapsed} trigger={null}>
      <Logo />
      <Menu
        mode="vertical"
        defaultSelectedKeys={[location.pathname]}
        onClick={onClick}
        items={menuItems}
        theme="dark"
      />
    </Layout.Sider>
  );
};

export default Aside;
