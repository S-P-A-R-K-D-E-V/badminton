'use client';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';

import { Chart, useChart, ChartLegends } from 'src/components/chart';

import type { AdminStats } from '@/lib/admin-stats';

import { WidgetSummary } from '../widget-summary';

// ----------------------------------------------------------------------

function formatVNDShort(amount: number) {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}tr`;
  if (amount >= 1_000) return `${Math.round(amount / 1_000)}k`;
  return `${amount}`;
}

type Props = {
  stats: AdminStats;
};

export function OverviewView({ stats }: Props) {
  const theme = useTheme();

  const months = stats.monthly.map((m) => m.month);

  const sessionsChartOptions = useChart({
    xaxis: { categories: months },
    tooltip: { y: { formatter: (value: number) => `${value} buổi` } },
  });

  const costChartOptions = useChart({
    xaxis: { categories: months },
    yaxis: { labels: { formatter: (value: number) => formatVNDShort(value) } },
    tooltip: {
      y: {
        formatter: (value: number) =>
          new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value),
      },
    },
    colors: [theme.palette.warning.main],
  });

  const totalPayment = stats.paidCount + stats.unpaidCount;
  const paymentChartOptions = useChart({
    labels: ['Đã trả', 'Chưa trả'],
    colors: [theme.palette.success.main, theme.palette.error.main],
    legend: { show: false },
    dataLabels: { enabled: true, dropShadow: { enabled: false } },
    tooltip: { y: { formatter: (value: number) => `${value} người` } },
    plotOptions: { pie: { donut: { labels: { show: false } } } },
  });

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" sx={{ mb: 3 }}>
        Tổng quan
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gap: 3,
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' },
          mb: 3,
        }}
      >
        <WidgetSummary
          title="Buổi chơi tháng này"
          total={stats.sessionsThisMonth}
          icon="solar:tennis-bold-duotone"
          color="primary"
        />
        <WidgetSummary
          title="Lượt đăng ký tháng này"
          total={stats.confirmedPlayers}
          icon="solar:users-group-rounded-bold-duotone"
          color="info"
        />
        <WidgetSummary
          title="Tỷ lệ lấp sân (10 buổi gần nhất)"
          total={`${stats.avgFillRate}%`}
          icon="solar:chart-2-bold-duotone"
          color="success"
        />
        <WidgetSummary
          title="Chưa thanh toán"
          total={stats.unpaidCount}
          icon="solar:wallet-money-bold-duotone"
          color="warning"
        />
      </Box>

      <Box
        sx={{
          display: 'grid',
          gap: 3,
          gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' },
          mb: 3,
        }}
      >
        <Card>
          <CardHeader title="Số buổi chơi theo tháng" />
          <Chart
            type="bar"
            series={[{ name: 'Buổi chơi', data: stats.monthly.map((m) => m.sessions) }]}
            options={sessionsChartOptions}
            sx={{ p: 3, pt: 1, height: 320 }}
          />
        </Card>

        <Card>
          <CardHeader title="Thanh toán (buổi đã diễn ra)" />
          {totalPayment > 0 ? (
            <>
              <Chart
                type="donut"
                series={[stats.paidCount, stats.unpaidCount]}
                options={paymentChartOptions}
                sx={{ p: 3, pt: 1, height: 260 }}
              />
              <ChartLegends
                labels={['Đã trả', 'Chưa trả']}
                colors={[theme.palette.success.main, theme.palette.error.main]}
                values={[`${stats.paidCount} người`, `${stats.unpaidCount} người`]}
                sx={{ px: 3, pb: 3, justifyContent: 'center' }}
              />
            </>
          ) : (
            <Typography variant="body2" sx={{ color: 'text.disabled', textAlign: 'center', py: 8 }}>
              Chưa có dữ liệu thanh toán
            </Typography>
          )}
        </Card>
      </Box>

      <Card>
        <CardHeader title="Chi phí theo tháng" />
        <Chart
          type="area"
          series={[{ name: 'Chi phí', data: stats.monthly.map((m) => m.cost) }]}
          options={costChartOptions}
          sx={{ p: 3, pt: 1, height: 320 }}
        />
      </Card>
    </Container>
  );
}
