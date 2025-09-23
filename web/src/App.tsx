import { Button, Layout, Typography } from 'antd'


const { Header, Content } = Layout


export default function App() {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header>
        <Typography.Title style={{ color: '#fff', margin: 0 }} level={4}>
          Web Blind
        </Typography.Title>
      </Header>
      <Content style={{ padding: 24 }}>
        <Button type="primary">Hello from frontend</Button>
      </Content>
    </Layout>
  )
}