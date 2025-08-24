import { DollarOutlined, TeamOutlined, UserOutlined, HomeOutlined, InfoCircleOutlined, WarningOutlined } from "@ant-design/icons";

export const menuItems = [
  {
    key: "/",
    icon: <HomeOutlined />,
    label: "Home",
  },
  {
    key: "/students",
    icon: <UserOutlined />,
    label: "Students",
  },
  {
    key: "/groups",
    icon: <TeamOutlined />,
    label: "Groups",
  },
  {
    key: "/payments",
    icon: <DollarOutlined />,
    label: "Payments",
  },
  {
    key: "/debtors",
    icon: <WarningOutlined />,
    label: "Debtors",
  },
  {
    key: "/about",
    icon: <InfoCircleOutlined />,
    label: "About",
  },
];
