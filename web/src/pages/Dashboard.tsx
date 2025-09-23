// src/pages/Dashboard.tsx
import React from "react";
import { Row, Col, Card, Statistic } from "antd";
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { Column } from '@ant-design/plots';

const Dashboard: React.FC = () => {
  // Dữ liệu tĩnh ví dụ
  const chartData = [
    { month: 'Jan', value: 30 },
    { month: 'Feb', value: 45 },
    { month: 'Mar', value: 60 },
    { month: 'Apr', value: 50 },
    { month: 'May', value: 70 },
  ];

  const config = {
    data: chartData,
    xField: 'month',
    yField: 'value',
    label: { position: 'middle', style: { fill: '#FFFFFF', opacity: 0.6 } },
    xAxis: { title: { text: 'Month' } },
    yAxis: { title: { text: 'Value' } },
    color: '#1890ff',
  };

  return (
    <div>
      <h1>Danh sách tính năng</h1>

      {/* Statistic Cards */}
      <Row gutter={16}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Tổng người dùng"
              value={1128}
              prefix={<ArrowUpOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Tính năng"
              value={56}
              prefix={<ArrowUpOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Đánh giá"
              value={24}
              prefix={<ArrowDownOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Truy cập"
              value={13450}
              precision={2}
              prefix=""
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Chart */}
      <Card style={{ marginTop: 24 }}>
        <h3>Lượng sách mới</h3>
        <Column {...config} />
      </Card>
    </div>
  );
};

export default Dashboard;
