import React, { useState } from "react";
import { Layout, theme } from "antd";
import { Outlet } from "react-router";

import Aside from "../../aside";
import { Header } from "../../header";

import styles from "./Layout.module.css";

const LayoutApp: React.FC = () => {
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  const [collapsed, setCollapsed] = useState(false);

  return (
    <Layout className={styles.layout}>
      <Aside collapsed={collapsed} />
      <Layout>
        <Header collapsed={collapsed} setCollapsed={setCollapsed} />
        <Layout.Content
          className={styles.content}
          style={{
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
          }}
        >
          <Outlet />
        </Layout.Content>
      </Layout>
    </Layout>
  );
};

export default LayoutApp;
