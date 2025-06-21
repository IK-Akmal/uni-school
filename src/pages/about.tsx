import React, { useEffect, useState } from 'react';
import { Layout, Card, Typography, Descriptions, Space, Divider, Tag, Row, Col, Spin } from 'antd';
import { InfoCircleOutlined, CodeOutlined, CalendarOutlined, EnvironmentOutlined, BuildOutlined } from '@ant-design/icons';
import { getAppInfo, type AppInfo } from '@/shared/utils/appInfo';

const { Content } = Layout;
const { Title, Text } = Typography;

const AboutPage: React.FC = () => {
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAppInfo = async () => {
      try {
        const info = await getAppInfo();
        setAppInfo(info);
      } catch (error) {
        console.error('Failed to load app info:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAppInfo();
  }, []);

  if (loading) {
    return (
      <Layout>
        <Content style={{ padding: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <Spin size="large" />
        </Content>
      </Layout>
    );
  }

  return (
    <Layout>
      <Content style={{ padding: '24px' }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Card>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div style={{ textAlign: 'center' }}>
                <InfoCircleOutlined style={{ fontSize: '48px', color: '#1890ff', marginBottom: '16px' }} />
                <Title level={2}>{appInfo?.name || 'School Management System'}</Title>
                <Text type="secondary">School Management System</Text>
              </div>

              <Divider />

              <Descriptions title="Application Information" column={1} bordered>
                <Descriptions.Item label="Version">
                  <Tag color="blue" icon={<CodeOutlined />}>
                    v{appInfo?.version}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Build Number">
                  <Tag color="green" icon={<BuildOutlined />}>
                    #{appInfo?.buildNumber}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Build Date">
                  <Tag color="orange" icon={<CalendarOutlined />}>
                    {appInfo?.buildDate}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Environment">
                  <Tag color={appInfo?.environment === 'Development' ? 'volcano' : 'green'} icon={<EnvironmentOutlined />}>
                    {appInfo?.environment}
                  </Tag>
                </Descriptions.Item>
              </Descriptions>
            </Space>
          </Card>

          <Card title="Features" size="small">
            <Row gutter={[16, 8]}>
              <Col span={12}>
                <Text>• Student data management</Text>
              </Col>
              <Col span={12}>
                <Text>• Group creation and management</Text>
              </Col>
              <Col span={12}>
                <Text>• Payment tracking and debt monitoring</Text>
              </Col>
              <Col span={12}>
                <Text>• Statistics and analytics</Text>
              </Col>
              <Col span={12}>
                <Text>• Overdue payment notifications</Text>
              </Col>
              <Col span={12}>
                <Text>• Modern user interface</Text>
              </Col>
            </Row>
          </Card>
        </Space>
      </Content>
    </Layout>
  );
};

export default AboutPage;
