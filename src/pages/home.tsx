import React from 'react';
import { Layout } from 'antd';
import { Dashboard } from '@/widgets/dashboard';

const { Content } = Layout;

const HomePage: React.FC = () => {
  return (
    <Layout>
      <Content style={{ padding: '24px' }}>
        <Dashboard />
      </Content>
    </Layout>
  );
};

export default HomePage;
